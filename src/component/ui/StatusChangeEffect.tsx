'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { StatusChange } from '@/hooks/status-change';
import { useStatusChange } from '@/hooks/status-change';

export type StatusChangeType = 'damage' | 'level' | 'bp' | 'base-bp' | 'block';

interface StatusChangeEffectProps {
  unitId: string;
  type: StatusChangeType;
  value: number | string;
  position?: { x: number; y: number }; // 位置をカスタマイズするための座標
  onComplete?: () => void;
}

export const StatusChangeEffect: React.FC<StatusChangeEffectProps> = ({
  unitId,
  type,
  value,
  position,
  onComplete,
}) => {
  // フェーズ状態の管理
  const [phase, setPhase] = useState<'initial' | 'appear' | 'hold' | 'fadeOut'>('initial');
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // 省略されていない場合はランダムな位置を生成
  const effectPosition = useMemo(() => {
    if (position) return position;

    // ±15pxの範囲でランダムな位置を生成
    return {
      x: 0, // Math.floor(Math.random() * 30) - 15,
      y: 0, // Math.floor(Math.random() * 30) - 15,
    };
  }, [position]);

  // フェーズ管理の実装
  useEffect(() => {
    // タイムアウトをクリア
    const clearTimeouts = () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };

    clearTimeouts(); // 既存のタイムアウトをクリア

    // フェーズに応じたタイムアウト設定
    let timeout: NodeJS.Timeout;

    if (phase === 'initial') {
      setPhase('hold');
    } else if (phase === 'hold') {
      // 保持フェーズからfadeOutへ
      timeout = setTimeout(() => setPhase('fadeOut'), 1000);
      timeoutsRef.current.push(timeout);
    } else if (phase === 'fadeOut') {
      // フェードアウトフェーズから完了
      timeout = setTimeout(() => {
        if (onComplete) onComplete();
      }, 300);
      timeoutsRef.current.push(timeout);
    }

    return clearTimeouts;
  }, [phase, onComplete]);

  // フェーズごとのスタイル
  const style = useMemo(() => {
    switch (phase) {
      case 'appear':
        return {
          opacity: 0,
          transform: `translate(${effectPosition.x}px, ${effectPosition.y - 10}px) scale(0.8)`,
        };
      case 'hold':
        return {
          opacity: 0.75,
          transform: `translate(${effectPosition.x}px, ${effectPosition.y}px) scale(1)`,
        };
      case 'fadeOut':
        return {
          opacity: 0,
          transform: `translate(${effectPosition.x}px, ${effectPosition.y - 20}px) scale(0.9)`,
        };
      default:
        return {
          opacity: 0,
          transform: `translate(${effectPosition.x}px, ${effectPosition.y}px) scale(0.5)`,
        };
    }
  }, [phase, effectPosition]);

  const DisplayContent = ({ type, value }: { type: string; value: number | string }) => {
    // Convert value to number for comparison (handles both number and numeric string)
    const numericValue = typeof value === 'number' ? value : Number(value);
    const isPositive = !isNaN(numericValue) && numericValue > 0;

    // Determine label text based on type and value
    let labelText = '';

    switch (type) {
      case 'bp':
        labelText = isPositive ? 'BPアップ' : 'BPダウン';
        break;
      case 'base-bp':
        labelText = isPositive ? '基本BPアップ' : '基本BPダウン';
        break;
      case 'damage':
        labelText = 'BPダメージ';
        break;
      case 'level':
        labelText = isPositive ? 'クロックアップ' : 'クロックダウン';
        break;
      case 'block':
        labelText = 'BLOCK';
        break;
      default:
        return null;
    }

    // Define text shadow styles based on value
    // Label color is based on type and value
    const labelShadowColor =
      type === 'block'
        ? 'rgba(59, 130, 246, 0.9)' // blue-500 for block
        : isPositive
          ? 'rgba(6, 182, 212, 0.9)' // cyan-500 for positive
          : 'rgba(239, 68, 68, 0.9)'; // red-500 for negative
    // Value shadow is always red
    const valueShadowColor = 'rgba(239, 68, 68, 0.9)'; // red-500

    const labelStyle = {
      textShadow: `0 0 10px ${labelShadowColor}, 0 0 8px ${labelShadowColor}`,
      fontWeight: 'bold',
      color: 'white',
    };

    const valueStyle = {
      textShadow: `0 0 10px ${valueShadowColor}, 0 0 8px ${valueShadowColor}`,
      fontWeight: 'bold',
      color: 'white',
    };

    // Determine value text - block type doesn't show value
    const valueText = type === 'block' ? '' : type === 'level' ? `Lv ${value}` : value;

    return (
      <>
        <div className="text-md text-center border-b-1 w-full" style={labelStyle}>
          {labelText}
        </div>
        {valueText && (
          <div className="text-lg" style={valueStyle}>
            {valueText}
          </div>
        )}
      </>
    );
  };

  return (
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-32"
      data-unit-id={unitId}
    >
      <div
        className="flex flex-col items-center px-1 py-1 bg-gray-500 opacity-10 rounded-sm border-2 border-gray-700"
        style={{
          fontWeight: 'bold',
          fontSize: '0.9rem',
          ...style,
          transition: 'all 0.3s ease-out',
        }}
      >
        <DisplayContent type={type} value={value} />
      </div>
    </div>
  );
};

// 複数のステータス変更を同時に表示するコンポーネント
interface MultipleStatusChangeProps {
  unitId: string;
  changes: StatusChange[];
  statusChangeId?: string; // コンテキストから渡されるID
  onComplete?: () => void;
}

export const MultipleStatusChange: React.FC<MultipleStatusChangeProps> = ({
  unitId,
  changes,
  statusChangeId,
  onComplete,
}) => {
  const [completedCount, setCompletedCount] = useState(0);
  const { removeStatusChange } = useStatusChange();

  // すべてのエフェクトが完了したら onComplete を呼び出す
  useEffect(() => {
    if (completedCount === changes.length) {
      // コンテキストのステータス変更を削除
      if (statusChangeId) {
        removeStatusChange(statusChangeId);
      }

      if (onComplete) {
        onComplete();
      }
    }
  }, [completedCount, changes.length, onComplete, removeStatusChange, statusChangeId]);

  return (
    <>
      {changes.map((change, index) => (
        <StatusChangeEffect
          key={`${unitId}-${change.type}-${index}`}
          unitId={unitId}
          type={change.type}
          value={change.value}
          onComplete={() => setCompletedCount(prev => prev + 1)}
        />
      ))}
    </>
  );
};
