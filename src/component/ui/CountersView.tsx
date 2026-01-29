import React from 'react';
import type { IDelta } from '@/submodule/suit/types/game/card';
import { Tooltip } from 'react-tooltip';

interface CountersViewProps {
  delta: IDelta[] | undefined;
}

export const CountersView: React.FC<CountersViewProps> = ({ delta }) => {
  if (!delta) return null;

  // Extract death and life counter values from delta
  const deathCounter = delta.find(d => d.effect.type === 'death');
  const lifeCounter = delta.find(d => d.effect.type === 'life');

  // If neither counter exists, don't render anything
  if (!deathCounter && !lifeCounter) return null;

  // If both counters exist, render them side by side
  if (deathCounter && lifeCounter) {
    return (
      <div className="absolute flex w-32" data-tooltip-id="both-counter">
        <div
          className="flex-1 h-5 bg-blue-700 flex items-center justify-center"
          style={{ clipPath: 'polygon(10% 100%, 0% 0%, 100% 0%, 100% 100%)' }}
        >
          <span className="text-white text-xs font-bold">Death {deathCounter.count}</span>
        </div>
        <div
          className="flex-1 h-5 bg-purple-700 flex items-center justify-center"
          style={{ clipPath: 'polygon(0% 100%, 0% 0%, 100% 0%, 90% 100%)' }}
        >
          <span className="text-white text-xs font-bold">Death {lifeCounter.count}</span>
        </div>
        <Tooltip id="both-counter" place={'bottom'} className="z-10">
          <span>
            このユニットはカウントが0になると「除外」または破壊されます。
            <br />
            カウントはあなたのターン終了時に1ずつ減ります。
            <br />
            「除外」は破壊と異なり、破壊された際の効果が発動しません。
            <br />
            捨札にも送られず、ゲーム内から完全に破棄されます。
            <br />
            デスカウンターと寿命カウンターの値が同じである場合、寿命カウンターが優先されます。
          </span>
        </Tooltip>
      </div>
    );
  }

  // If only death counter exists
  if (deathCounter) {
    return (
      <>
        <div
          className="absolute w-16 h-5 bg-blue-700 flex items-center justify-center"
          style={{ clipPath: 'polygon(10% 100%, 0% 0%, 100% 0%, 90% 100%)' }}
          data-tooltip-id="death-counter"
        >
          <span className="text-white text-xs font-bold">Death {deathCounter.count}</span>
        </div>
        <Tooltip id="death-counter" place={'bottom'} className="z-10">
          <span>
            このユニットはカウントが0になると破壊されます。
            <br />
            カウントはあなたのターン終了時に1ずつ減ります。
          </span>
        </Tooltip>
      </>
    );
  }

  // If only life counter exists
  if (lifeCounter) {
    return (
      <>
        <div
          className="absolute w-16 h-5 bg-purple-700 flex items-center justify-center"
          style={{ clipPath: 'polygon(10% 100%, 0% 0%, 100% 0%, 90% 100%)' }}
          data-tooltip-id="life-counter"
        >
          <span className="text-white text-xs font-bold">Death {lifeCounter.count}</span>
        </div>
        <Tooltip id="life-counter" place={'bottom'} className="z-10">
          <span>
            このユニットはカウントが0になると「除外」されます。
            <br />
            カウントはあなたのターン終了時に1ずつ減ります。
            <br />
            「除外」は破壊と異なり、破壊された際の効果が発動しません。
            <br />
            捨札にも送られず、ゲーム内から完全に破棄されます。
            <br />
            このカウンタが【ウィルス】以外に付与されることはありません。
          </span>
        </Tooltip>
      </>
    );
  }

  return null;
};
