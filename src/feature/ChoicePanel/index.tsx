import React, { useEffect } from 'react';
import { useChoicePanel } from './context';
import { LocalStorageHelper } from '@/service/local-storage';

// 秒数を「00"00」形式（小数点2桁）にフォーマット
function formatRemainTime(sec: number | null): string {
  if (sec === null) return '--"--';
  const s = Math.floor(sec);
  const cs = Math.floor((sec - s) * 100);
  return `${s.toString().padStart(2, '0')}"${cs.toString().padStart(2, '0')}`;
}

interface ChoiceButtonProps {
  label: string;
  option: {
    id: string;
    label: string;
    enabled: boolean;
  };
  onSelected: () => void;
  selected?: boolean;
  disabled?: boolean;
}
const ChoiceButton = ({
  label,
  option,
  onSelected,
  selected = false,
  disabled = false,
}: ChoiceButtonProps) => {
  return (
    <div className="flex flex-col items-center justify-start w-64">
      <span className="text-white text-xs mb-1">{label}</span>
      <div className="relative w-full h-24 flex items-center justify-center">
        <button
          className={`w-full h-full rounded-lg text-xl font-bold shadow transition-colors relative
            ${
              !disabled
                ? 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer'
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
            }
            ${selected ? 'ring-4 ring-yellow-400' : ''}
          `}
          disabled={disabled || selected}
          style={{ zIndex: 2 }}
          onClick={onSelected}
        >
          {option.label}
        </button>
        <div className="animate-button-border-wave" />
      </div>
    </div>
  );
};

export const ChoicePanel: React.FC = () => {
  const { state, select } = useChoicePanel();
  const { options, remainTime, selectedId, player, title } = state;

  const myPlayerId = LocalStorageHelper.playerId();
  const isMyTurn = player === myPlayerId;

  // 時間切れ時は先頭選択肢を自動選択
  useEffect(() => {
    if (options && options.length > 0 && remainTime !== null && remainTime <= 0 && !selectedId) {
      select(options[0].id);
    }
  }, [remainTime, options, selectedId, select]);

  // 選択肢がなければ何も描画しない
  if (!options || options.length < 2) return null;

  // 上部ラベル
  const topLabel = isMyTurn ? 'あなたが選択して下さい' : '対戦相手選択中';

  return (
    <div className="fixed inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
      <div className="bg-slate-700/60 rounded-xl shadow-lg px-8 py-6 flex flex-col items-center gap-4 pointer-events-auto min-w-[700px]">
        {/* 上部ラベル */}
        <h2 className="text-lg text-white font-bold mb-2">{topLabel}</h2>
        {/* 残り時間 */}
        <div className="text-white text-md font-mono">{formatRemainTime(remainTime)}</div>
        <div className="flex flex-row items-center gap-8">
          {/* 左ボタン */}
          <ChoiceButton
            label={title ?? ''}
            option={options[0]}
            onSelected={() => select(options[0].id)}
            selected={options[0].id === selectedId}
            disabled={!isMyTurn || !options[0].enabled || !!selectedId}
          />

          {/* 中央テキスト */}
          <div
            className="mx-4 text-white text-center select-none pointer-events-none"
            style={{ minWidth: '220px' }}
          >
            <p className="text-sm">
              発動するアビリティを
              <br />
              選択して下さい
            </p>
          </div>
          {/* 右ボタン */}
          <ChoiceButton
            label={title ?? ''}
            option={options[1]}
            onSelected={() => select(options[1].id)}
            selected={options[1].id === selectedId}
            disabled={!isMyTurn || !options[1].enabled || !!selectedId}
          />
        </div>
      </div>
    </div>
  );
};
