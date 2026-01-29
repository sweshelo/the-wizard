import type { RefObject } from 'react';
import React, { useState, useEffect, useCallback } from 'react';
import { useWebSocketGame } from '@/hooks/game';
import { useUnitSelection } from '@/hooks/unit-selection';
import type { IUnit } from '@/submodule/suit/types';
import { LocalStorageHelper } from '@/service/local-storage';
import { useTimer } from '@/feature/Timer/hooks';

interface UnitActionButtonsProps {
  unit: IUnit;
  unitRef: RefObject<HTMLDivElement | null>;
  canAttack?: boolean;
  canBoot?: boolean;
  canWithdraw?: boolean;
}

export const UnitActionButtons = ({
  unit,
  canAttack = false,
  canBoot,
  canWithdraw = true,
}: UnitActionButtonsProps) => {
  const { setActiveUnit } = useUnitSelection();
  const { withdrawal, boot, send } = useWebSocketGame();
  const { totalSeconds } = useTimer();

  // タッチデバイスでの二重タップ防止: コンポーネント表示直後はタッチを無視
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 150);
    return () => clearTimeout(timer);
  }, []);

  // タッチイベントの伝搬を防止するハンドラ
  const preventTouchPropagation = useCallback(
    (e: React.TouchEvent) => {
      if (!isReady) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [isReady]
  );

  // Handle action button clicks
  const handleAttack = () => {
    // AttackPayloadを送信
    if (unit) {
      send({
        action: {
          type: 'game',
          handler: 'core',
        },
        payload: {
          type: 'Attack',
          player: LocalStorageHelper.playerId(),
          target: unit,
          remainingTime: totalSeconds,
        },
      });
    }
    setActiveUnit(undefined);
  };

  const handleWithdrawal = () => {
    console.log(`Unit ${unit.id} withdrawing`);
    // Implement withdrawal logic here
    setActiveUnit(undefined);
    withdrawal({ target: unit });
  };

  const handleBoot = () => {
    console.log(`Unit ${unit.id} booting`);
    // Implement boot logic here
    setActiveUnit(undefined);
    boot({ target: unit });
  };

  return (
    <div
      className="absolute inset-0 pointer-events-auto z-5 flex flex-col justify-between px-2 py-1"
      onTouchStart={preventTouchPropagation}
      onTouchEnd={preventTouchPropagation}
    >
      {/* Attack Button (top) */}
      {canAttack ? (
        <button
          className="action-button bg-red-500 text-white py-1 rounded-md shadow-md border border-red-700 hover:bg-red-600 w-full opacity-90"
          onClick={handleAttack}
          disabled={!isReady}
        >
          アタック
        </button>
      ) : (
        <div className="h-8"></div> /* Placeholder to maintain spacing */
      )}

      {/* Boot Button (middle) */}
      {canBoot !== undefined ? (
        <button
          className="action-button bg-pink-500 text-white py-1 rounded-md shadow-md border border-pink-700 hover:bg-pink-600 disabled:bg-gray-500 disabled:opacity-70 w-full opacity-90"
          onClick={handleBoot}
          disabled={!canBoot || !isReady}
        >
          起動
        </button>
      ) : (
        <div className="h-8"></div> /* Placeholder to maintain spacing */
      )}

      {/* Withdrawal Button (bottom) */}
      {canWithdraw ? (
        <button
          className="action-button bg-blue-500 text-white py-1 rounded-md shadow-md border border-blue-700 hover:bg-blue-600 w-full opacity-90"
          onClick={handleWithdrawal}
          disabled={!isReady}
        >
          撤退
        </button>
      ) : (
        <div className="h-8"></div> /* Placeholder to maintain spacing */
      )}
    </div>
  );
};
