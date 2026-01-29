'use client';

// src/component/ai/AIChatInteraction.tsx

import { useState, useCallback, useMemo } from 'react';
import { useAIChatStore } from '@/ai/chat/store';
import type { InteractionOption, UserFeedback } from '@/ai/chat/types';

/**
 * AIChatInteractionのプロパティ
 */
export interface AIChatInteractionProps {
  /** メッセージID */
  messageId: string;
  /** フィードバック選択時のコールバック */
  onFeedback?: (optionId: string) => void;
  /** 戦略調整時のコールバック */
  onStrategyAdjustment?: () => void;
  /** テキストフィードバックを有効化 */
  enableTextFeedback?: boolean;
}

/**
 * AIチャットインタラクションコンポーネント
 * フィードバックボタンの表示と選択結果の送信を担当
 */
export function AIChatInteraction({
  messageId,
  onFeedback,
  onStrategyAdjustment,
  enableTextFeedback = false,
}: AIChatInteractionProps) {
  const [showTextInput, setShowTextInput] = useState(false);
  const [textFeedback, setTextFeedback] = useState('');

  const { messages, submitFeedback } = useAIChatStore();

  // 対象メッセージを検索
  const message = useMemo(() => messages.find(m => m.id === messageId), [messages, messageId]);

  // インタラクション情報
  const interaction = message?.interaction;
  const interactionType = interaction?.type;
  const options = interaction?.options ?? [];
  const selected = interaction?.selected;

  // フィードバック送信ハンドラ
  const handleFeedback = useCallback(
    (optionId: string) => {
      // interactionTypeが無効な場合は何もしない
      if (!interactionType || interactionType === 'none') {
        return;
      }

      // 戦略調整でテキスト入力が有効な場合は、テキスト入力を表示
      if (optionId === 'needs-adjustment' && enableTextFeedback) {
        setShowTextInput(true);
        onStrategyAdjustment?.();
        onFeedback?.(optionId);
        return;
      }

      const feedback: UserFeedback = {
        messageId,
        interactionType: interactionType,
        response: {
          selected: optionId,
        },
        timestamp: new Date(),
      };

      submitFeedback(feedback);

      // コールバック呼び出し
      onFeedback?.(optionId);

      // 戦略調整が必要な場合（テキスト入力なし）
      if (optionId === 'needs-adjustment') {
        onStrategyAdjustment?.();
      }
    },
    [
      messageId,
      interactionType,
      submitFeedback,
      onFeedback,
      onStrategyAdjustment,
      enableTextFeedback,
    ]
  );

  // テキストフィードバック送信ハンドラ
  const handleTextSubmit = useCallback(() => {
    if (!textFeedback.trim()) return;

    const feedback: UserFeedback = {
      messageId,
      interactionType: 'text',
      response: {
        text: textFeedback,
      },
      timestamp: new Date(),
    };

    submitFeedback(feedback);
    setTextFeedback('');
    setShowTextInput(false);
  }, [messageId, textFeedback, submitFeedback]);

  // インタラクションがない場合、または'none'タイプの場合は何も表示しない
  if (!interaction || interactionType === 'none') {
    return null;
  }

  // 既に選択済みの場合は選択結果を表示（テキスト入力モードでない場合）
  if (selected && !showTextInput) {
    const selectedOption = options.find(opt => opt.id === selected);
    return (
      <div className="mt-2 text-xs text-gray-400">
        <span className="text-green-400">✓</span> {selectedOption?.label ?? selected}
      </div>
    );
  }

  // テキスト入力モードの場合
  if (showTextInput) {
    return (
      <div className="mt-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={textFeedback}
            onChange={e => setTextFeedback(e.target.value)}
            placeholder="調整内容を入力..."
            aria-label="戦略調整のフィードバック"
            className="flex-1 bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleTextSubmit}
            disabled={!textFeedback.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs px-3 py-1 rounded"
          >
            送信
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2">
      {/* オプションボタン */}
      <div className="flex gap-2 flex-wrap">
        {options.map((option: InteractionOption) => (
          <button
            type="button"
            key={option.id}
            onClick={() => handleFeedback(option.id)}
            className={getButtonClassName(interactionType)}
            aria-label={option.description ?? option.label}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * インタラクションタイプに応じたボタンのクラス名を取得
 */
function getButtonClassName(type: string | undefined): string {
  const baseClass = 'text-white text-xs px-3 py-1 rounded transition-colors';

  switch (type) {
    case 'confirm':
      return `${baseClass} bg-green-600 hover:bg-green-700`;
    case 'rating':
      return `${baseClass} bg-blue-600 hover:bg-blue-700`;
    case 'choice':
      return `${baseClass} bg-purple-600 hover:bg-purple-700`;
    default:
      return `${baseClass} bg-gray-600 hover:bg-gray-700`;
  }
}
