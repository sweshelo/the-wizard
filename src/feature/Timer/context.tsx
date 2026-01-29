'use client';

import { useRef, useCallback } from 'react';
import { useTimer as useTimerHook } from 'react-timer-hook';
import type { TimerContextType, TimerProviderProps } from './hooks';
import { TimerContext } from './hooks';

export const TimerProvider = ({ children, initialTime = 60 }: TimerProviderProps) => {
  // タイマー開始時刻
  const startTimeRef = useRef<number | null>(null);
  // 開始時の残り秒数
  const startSecondsRef = useRef<number>(initialTime);
  // 一時停止時の残り秒数
  const pausedSecondsRef = useRef<number | null>(null);

  const getExpiryTimestamp = (seconds: number) => {
    const time = new Date();
    time.setSeconds(time.getSeconds() + seconds);
    return time;
  };

  const { totalSeconds, isRunning, restart } = useTimerHook({
    expiryTimestamp: getExpiryTimestamp(initialTime),
    autoStart: false,
    interval: 100,
  });

  const resetTimer = useCallback(() => {
    startTimeRef.current = null;
    startSecondsRef.current = initialTime;
    pausedSecondsRef.current = initialTime;
    restart(getExpiryTimestamp(initialTime), false);
  }, [initialTime, restart]);

  const resumeTimer = useCallback(() => {
    const secondsToUse = pausedSecondsRef.current ?? initialTime;
    startTimeRef.current = Date.now();
    startSecondsRef.current = secondsToUse;
    pausedSecondsRef.current = null;
    restart(getExpiryTimestamp(secondsToUse), true);
  }, [initialTime, restart]);

  const pauseTimer = useCallback(() => {
    // 開始時刻から経過時間を計算して残り時間を求める
    if (startTimeRef.current !== null) {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, startSecondsRef.current - elapsed);
      pausedSecondsRef.current = remaining;
      restart(getExpiryTimestamp(remaining), false);
    } else {
      // タイマーがまだ開始されていない場合
      pausedSecondsRef.current = pausedSecondsRef.current ?? initialTime;
      restart(getExpiryTimestamp(pausedSecondsRef.current), false);
    }
  }, [initialTime, restart]);

  const endTurn = useCallback(() => {
    startTimeRef.current = null;
    startSecondsRef.current = 0;
    pausedSecondsRef.current = null;
    restart(new Date(), false);
  }, [restart]);

  // 残り時間を外部から設定（サーバー同期用）
  const setRemainingTime = useCallback(
    (seconds: number) => {
      const clampedSeconds = Math.max(0, seconds);
      startTimeRef.current = Date.now();
      startSecondsRef.current = clampedSeconds;
      pausedSecondsRef.current = clampedSeconds;
      restart(getExpiryTimestamp(clampedSeconds), isRunning);
    },
    [restart, isRunning]
  );

  // 指定した時間でタイマーをリセット（TurnChange用）
  const resetWithDuration = useCallback(
    (seconds: number) => {
      startTimeRef.current = null;
      startSecondsRef.current = seconds;
      pausedSecondsRef.current = seconds;
      restart(getExpiryTimestamp(seconds), false);
    },
    [restart]
  );

  const value: TimerContextType = {
    totalSeconds,
    maxTime: initialTime,
    isRunning,
    pauseTimer,
    resumeTimer,
    resetTimer,
    endTurn,
    setRemainingTime,
    resetWithDuration,
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
};
