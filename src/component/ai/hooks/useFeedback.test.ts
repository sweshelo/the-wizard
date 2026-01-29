// src/component/ai/hooks/useFeedback.test.ts
import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { renderHook, act } from '@testing-library/react';
import { useFeedback } from './useFeedback';
import { useAIChatStore } from '@/ai/chat/store';
import type { AIChatMessage, InteractionOption } from '@/ai/chat/types';

// テスト用のメッセージを生成
function createTestMessage(
  id: string,
  interactionType: 'confirm' | 'choice' | 'rating' | 'none' = 'rating',
  options: InteractionOption[] = []
): AIChatMessage {
  return {
    id,
    timestamp: new Date(),
    category: 'pregame_analysis',
    priority: 'high',
    content: {
      title: 'テスト分析',
      body: 'テスト内容',
    },
    meta: {
      model: 'haiku',
    },
    interaction: {
      type: interactionType,
      options,
    },
  };
}

describe('useFeedback', () => {
  beforeEach(() => {
    // ストアをリセット
    useAIChatStore.getState().clearMessages();
  });

  describe('submitFeedback', () => {
    it('should submit feedback to the store', () => {
      const message = createTestMessage('msg-1', 'rating', [
        { id: 'helpful', label: '参考になった' },
        { id: 'needs-adjustment', label: '調整が必要' },
      ]);

      // メッセージを追加
      useAIChatStore.getState().addMessage(message);

      const { result } = renderHook(() => useFeedback(message.id));

      act(() => {
        result.current.submitFeedback('helpful');
      });

      // ストアの状態を確認
      const updatedMessage = useAIChatStore.getState().messages.find(m => m.id === 'msg-1');
      expect(updatedMessage?.interaction?.selected).toBe('helpful');
    });

    it('should set isSubmitting while processing', () => {
      const message = createTestMessage('msg-2', 'rating', [
        { id: 'helpful', label: '参考になった' },
      ]);

      useAIChatStore.getState().addMessage(message);

      const { result } = renderHook(() => useFeedback(message.id));

      expect(result.current.isSubmitting).toBe(false);

      act(() => {
        result.current.submitFeedback('helpful');
      });

      // 送信完了後
      expect(result.current.selectedOption).toBe('helpful');
    });

    it('should mark as submitted after feedback', () => {
      const message = createTestMessage('msg-3', 'rating', [
        { id: 'helpful', label: '参考になった' },
      ]);

      useAIChatStore.getState().addMessage(message);

      const { result } = renderHook(() => useFeedback(message.id));

      expect(result.current.isSubmitted).toBe(false);

      act(() => {
        result.current.submitFeedback('helpful');
      });

      expect(result.current.isSubmitted).toBe(true);
    });
  });

  describe('submitTextFeedback', () => {
    it('should submit text feedback', () => {
      const message = createTestMessage('msg-4', 'choice', [
        { id: 'option-1', label: 'オプション1' },
      ]);

      useAIChatStore.getState().addMessage(message);

      const { result } = renderHook(() => useFeedback(message.id));

      act(() => {
        result.current.submitTextFeedback('戦略を調整してください');
      });

      const updatedMessage = useAIChatStore.getState().messages.find(m => m.id === 'msg-4');
      expect(updatedMessage?.interaction?.feedback).toBe('戦略を調整してください');
    });
  });

  describe('onStrategyAdjustment', () => {
    it('should trigger callback when needs-adjustment is selected', () => {
      const message = createTestMessage('msg-5', 'rating', [
        { id: 'helpful', label: '参考になった' },
        { id: 'needs-adjustment', label: '調整が必要' },
      ]);

      useAIChatStore.getState().addMessage(message);

      const onAdjustment = mock(() => {});

      const { result } = renderHook(() =>
        useFeedback(message.id, { onStrategyAdjustment: onAdjustment })
      );

      act(() => {
        result.current.submitFeedback('needs-adjustment');
      });

      expect(onAdjustment).toHaveBeenCalledTimes(1);
    });

    it('should not trigger callback when helpful is selected', () => {
      const message = createTestMessage('msg-6', 'rating', [
        { id: 'helpful', label: '参考になった' },
        { id: 'needs-adjustment', label: '調整が必要' },
      ]);

      useAIChatStore.getState().addMessage(message);

      const onAdjustment = mock(() => {});

      const { result } = renderHook(() =>
        useFeedback(message.id, { onStrategyAdjustment: onAdjustment })
      );

      act(() => {
        result.current.submitFeedback('helpful');
      });

      expect(onAdjustment).toHaveBeenCalledTimes(0);
    });
  });

  describe('getInteractionOptions', () => {
    it('should return interaction options from message', () => {
      const options: InteractionOption[] = [
        { id: 'opt-1', label: 'オプション1', description: '説明1' },
        { id: 'opt-2', label: 'オプション2', description: '説明2' },
      ];

      const message = createTestMessage('msg-7', 'choice', options);

      useAIChatStore.getState().addMessage(message);

      const { result } = renderHook(() => useFeedback(message.id));

      expect(result.current.options).toEqual(options);
    });

    it('should return empty array if no interaction', () => {
      const message: AIChatMessage = {
        id: 'msg-8',
        timestamp: new Date(),
        category: 'system',
        priority: 'low',
        content: {
          title: 'システム',
          body: 'メッセージ',
        },
        meta: {
          model: 'haiku',
        },
      };

      useAIChatStore.getState().addMessage(message);

      const { result } = renderHook(() => useFeedback(message.id));

      expect(result.current.options).toEqual([]);
    });
  });

  describe('interactionType', () => {
    it('should return the interaction type', () => {
      const message = createTestMessage('msg-9', 'confirm', []);

      useAIChatStore.getState().addMessage(message);

      const { result } = renderHook(() => useFeedback(message.id));

      expect(result.current.interactionType).toBe('confirm');
    });

    it('should return null if message not found', () => {
      const { result } = renderHook(() => useFeedback('non-existent-id'));

      expect(result.current.interactionType).toBeNull();
    });
  });
});
