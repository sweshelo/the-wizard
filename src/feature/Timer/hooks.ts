import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

// 型定義
export interface TimerContextType {
  totalSeconds: number; // 残り秒数
  maxTime: number; // 最大秒数（サークル比率計算用）
  isRunning: boolean;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  endTurn: () => void;
  setRemainingTime: (seconds: number) => void; // 残り時間を外部から設定（サーバー同期用）
  resetWithDuration: (seconds: number) => void; // 指定した時間でタイマーをリセット（TurnChange用）
}

export interface TimerProviderProps {
  children: ReactNode;
  initialTime?: number;
}

// タイマーコントロール用のコンテキスト
export const TimerContext = createContext<TimerContextType | null>(null);

export const useTimer = (): TimerContextType => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};
