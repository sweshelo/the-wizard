// src/component/ai/hooks/useFeedback.ts

import { useCallback, useMemo, useState } from 'react';
import { useAIChatStore } from '@/ai/chat/store';
import type { InteractionOption, UserFeedback } from '@/ai/chat/types';

/**
 * useFeedbackのオプション
 */
export interface UseFeedbackOptions {
  /** 戦略調整が必要な時のコールバック */
  onStrategyAdjustment?: () => void;
}

/**
 * useFeedbackの戻り値
 */
export interface UseFeedbackReturn {
  /** フィードバックを送信中 */
  isSubmitting: boolean;
  /** フィードバック送信済み */
  isSubmitted: boolean;
  /** 選択されたオプション */
  selectedOption: string | null;
  /** インタラクションタイプ */
  interactionType: 'confirm' | 'choice' | 'rating' | 'none' | null;
  /** インタラクションオプション */
  options: InteractionOption[];
  /** フィードバックを送信 */
  submitFeedback: (optionId: string) => void;
  /** テキストフィードバックを送信 */
  submitTextFeedback: (text: string) => void;
}

/**
 * フィードバック機能を提供するフック
 *
 * @param messageId 対象メッセージID
 * @param options オプション
 */
export function useFeedback(
  messageId: string,
  options: UseFeedbackOptions = {}
): UseFeedbackReturn {
  const { onStrategyAdjustment } = options;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const { messages, submitFeedback: storeSubmitFeedback } = useAIChatStore();

  // 対象メッセージを検索
  const message = useMemo(() => messages.find(m => m.id === messageId), [messages, messageId]);

  // インタラクションタイプ
  const interactionType = useMemo(() => {
    return message?.interaction?.type ?? null;
  }, [message]);

  // オプション一覧
  const options_ = useMemo(() => {
    return message?.interaction?.options ?? [];
  }, [message]);

  // 送信済みかどうか
  const isSubmitted = useMemo(() => {
    return selectedOption !== null || message?.interaction?.selected !== undefined;
  }, [selectedOption, message?.interaction?.selected]);

  // フィードバック送信
  const submitFeedback = useCallback(
    (optionId: string) => {
      // interactionTypeが無効な場合は何もしない
      if (!interactionType || interactionType === 'none') {
        return;
      }

      setIsSubmitting(true);

      const feedback: UserFeedback = {
        messageId,
        interactionType: interactionType,
        response: {
          selected: optionId,
        },
        timestamp: new Date(),
      };

      storeSubmitFeedback(feedback);
      setSelectedOption(optionId);
      setIsSubmitting(false);

      // 調整が必要な場合、コールバックを呼び出す
      if (optionId === 'needs-adjustment' && onStrategyAdjustment) {
        onStrategyAdjustment();
      }
    },
    [messageId, interactionType, storeSubmitFeedback, onStrategyAdjustment]
  );

  // テキストフィードバック送信
  const submitTextFeedback = useCallback(
    (text: string) => {
      setIsSubmitting(true);

      const feedback: UserFeedback = {
        messageId,
        interactionType: 'text',
        response: {
          text,
        },
        timestamp: new Date(),
      };

      storeSubmitFeedback(feedback);
      setIsSubmitting(false);
    },
    [messageId, storeSubmitFeedback]
  );

  return {
    isSubmitting,
    isSubmitted,
    selectedOption,
    interactionType,
    options: options_,
    submitFeedback,
    submitTextFeedback,
  };
}
