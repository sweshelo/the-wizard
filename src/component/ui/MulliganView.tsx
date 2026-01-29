import React, { useCallback, useEffect, useState } from 'react';
import { useWebSocketGame } from '@/hooks/game/websocket';
import { useSoundV2 } from '@/hooks/soundV2';
import type { Message } from '@/submodule/suit/types';
import { createMessage } from '@/submodule/suit/types';
import { LocalStorageHelper } from '@/service/local-storage';
import { useMulligan, useTimer } from '@/hooks/mulligan/context';

export const MulliganView: React.FC = () => {
  const { showMulligan, setShowMulligan, timeLeft } = useMulligan();
  const { stopTimer } = useTimer();
  const { send } = useWebSocketGame();
  const { play } = useSoundV2();

  // Use local rendering state to ensure smooth animation
  const [displayTime, setDisplayTime] = useState<string>('10"00');

  // Update the display time whenever timeLeft changes
  useEffect(() => {
    // Format time as 00"00 with centiseconds
    const seconds = Math.floor(timeLeft);
    const centiseconds = Math.floor((timeLeft - seconds) * 100);

    // Ensure proper formatting with leading zeros
    const formattedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
    const formattedCentiseconds = centiseconds < 10 ? `0${centiseconds}` : `${centiseconds}`;

    setDisplayTime(`${formattedSeconds}"${formattedCentiseconds}`);
  }, [timeLeft]);

  const handleNo = useCallback(() => {
    const message: Message = createMessage({
      action: {
        type: 'game',
        handler: 'core',
      },
      payload: {
        type: 'Mulligan',
        action: 'done',
        player: LocalStorageHelper.playerId(),
      },
    });
    send(message);
    setShowMulligan(false);
    stopTimer();
  }, [send, setShowMulligan, stopTimer]);

  const handleYes = useCallback(() => {
    const message: Message = createMessage({
      action: {
        type: 'game',
        handler: 'core',
      },
      payload: {
        type: 'Mulligan',
        action: 'retry',
        player: LocalStorageHelper.playerId(),
      },
    });
    send(message);
    play('decide');

    // Only hide the UI but keep timer running
    setShowMulligan(false);
  }, [play, send, setShowMulligan]);

  if (!showMulligan) return null;

  return (
    <div className="absolute w-full flex flex-col items-center bg-black/70 p-2.5 rounded-lg z-10 -top-[150px]">
      <div className="flex justify-center items-center mb-2.5 text-white text-lg gap-2.5">
        <span>手札を引き直しますか？</span>
        <span
          className="ml-2.5 font-bold text-xl inline-block"
          key={displayTime} // Key for proper animation rerendering
          style={{
            animation: 'pulse 0.5s infinite alternate',
            textShadow: '0 0 5px rgba(255, 255, 255, 0.7)',
          }}
        >
          {displayTime}
        </span>
      </div>
      <div className="flex gap-5">
        <button
          className="bg-blue-600 text-white py-2 px-5 border-0 rounded cursor-pointer"
          onClick={handleYes}
        >
          はい
        </button>
        <button
          className="bg-red-600 text-white py-2 px-5 border-0 rounded cursor-pointer"
          onClick={handleNo}
        >
          いいえ
        </button>
      </div>
    </div>
  );
};
