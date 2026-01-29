// src/component/ai/AIChatInteraction.test.tsx
import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { render, screen, fireEvent } from '@testing-library/react';
import { AIChatInteraction } from './AIChatInteraction';
import { useAIChatStore } from '@/ai/chat/store';
import type { AIChatMessage, InteractionOption } from '@/ai/chat/types';

// テスト用メッセージを作成
function createTestMessage(
  id: string,
  interactionType: 'confirm' | 'choice' | 'rating' | 'none' = 'rating',
  options: InteractionOption[] = [],
  selected?: string
): AIChatMessage {
  return {
    id,
    timestamp: new Date(),
    category: 'pregame_analysis',
    priority: 'high',
    content: {
      title: 'デッキ分析',
      body: 'テスト分析内容',
    },
    meta: {
      model: 'haiku',
    },
    interaction: {
      type: interactionType,
      options,
      selected,
    },
  };
}

describe('AIChatInteraction', () => {
  beforeEach(() => {
    useAIChatStore.getState().clearMessages();
  });

  describe('feedback button display', () => {
    it('should render feedback buttons for rating type', () => {
      const message = createTestMessage('msg-1', 'rating', [
        { id: 'helpful', label: '参考になった' },
        { id: 'needs-adjustment', label: '調整が必要' },
      ]);

      useAIChatStore.getState().addMessage(message);

      render(<AIChatInteraction messageId={message.id} />);

      expect(screen.getByRole('button', { name: /参考になった/ })).toBeDefined();
      expect(screen.getByRole('button', { name: /調整が必要/ })).toBeDefined();
    });

    it('should render choice buttons for choice type', () => {
      const message = createTestMessage('msg-2', 'choice', [
        { id: 'opt-1', label: 'オプション1' },
        { id: 'opt-2', label: 'オプション2' },
        { id: 'opt-3', label: 'オプション3' },
      ]);

      useAIChatStore.getState().addMessage(message);

      render(<AIChatInteraction messageId={message.id} />);

      expect(screen.getByRole('button', { name: /オプション1/ })).toBeDefined();
      expect(screen.getByRole('button', { name: /オプション2/ })).toBeDefined();
      expect(screen.getByRole('button', { name: /オプション3/ })).toBeDefined();
    });

    it('should render confirm button for confirm type', () => {
      const message = createTestMessage('msg-3', 'confirm', [{ id: 'confirm', label: '了解' }]);

      useAIChatStore.getState().addMessage(message);

      render(<AIChatInteraction messageId={message.id} />);

      expect(screen.getByRole('button', { name: /了解/ })).toBeDefined();
    });

    it('should not render anything for none type', () => {
      const message = createTestMessage('msg-4', 'none', []);

      useAIChatStore.getState().addMessage(message);

      const { container } = render(<AIChatInteraction messageId={message.id} />);

      expect(container.firstChild).toBeNull();
    });

    it('should not render anything if already selected', () => {
      const message = createTestMessage(
        'msg-5',
        'rating',
        [
          { id: 'helpful', label: '参考になった' },
          { id: 'needs-adjustment', label: '調整が必要' },
        ],
        'helpful' // already selected
      );

      useAIChatStore.getState().addMessage(message);

      const { container } = render(<AIChatInteraction messageId={message.id} />);

      // 選択済みの場合は選択結果を表示
      expect(screen.getByText(/参考になった/)).toBeDefined();
      // ボタンは表示されない
      expect(screen.queryByRole('button')).toBeNull();
    });
  });

  describe('selection submission', () => {
    it('should update store when button is clicked', () => {
      const message = createTestMessage('msg-6', 'rating', [
        { id: 'helpful', label: '参考になった' },
        { id: 'needs-adjustment', label: '調整が必要' },
      ]);

      useAIChatStore.getState().addMessage(message);

      render(<AIChatInteraction messageId={message.id} />);

      fireEvent.click(screen.getByRole('button', { name: /参考になった/ }));

      const updatedMessage = useAIChatStore.getState().messages.find(m => m.id === 'msg-6');
      expect(updatedMessage?.interaction?.selected).toBe('helpful');
    });

    it('should call onFeedback callback when provided', () => {
      const message = createTestMessage('msg-7', 'rating', [
        { id: 'helpful', label: '参考になった' },
      ]);

      useAIChatStore.getState().addMessage(message);

      const onFeedback = mock(() => {});

      render(<AIChatInteraction messageId={message.id} onFeedback={onFeedback} />);

      fireEvent.click(screen.getByRole('button', { name: /参考になった/ }));

      expect(onFeedback).toHaveBeenCalledWith('helpful');
    });
  });

  describe('strategy adjustment', () => {
    it('should call onStrategyAdjustment when needs-adjustment is selected', () => {
      const message = createTestMessage('msg-8', 'rating', [
        { id: 'helpful', label: '参考になった' },
        { id: 'needs-adjustment', label: '調整が必要' },
      ]);

      useAIChatStore.getState().addMessage(message);

      const onStrategyAdjustment = mock(() => {});

      render(
        <AIChatInteraction messageId={message.id} onStrategyAdjustment={onStrategyAdjustment} />
      );

      fireEvent.click(screen.getByRole('button', { name: /調整が必要/ }));

      expect(onStrategyAdjustment).toHaveBeenCalledTimes(1);
    });

    it('should show text input when adjustment mode is enabled', () => {
      const message = createTestMessage('msg-9', 'rating', [
        { id: 'helpful', label: '参考になった' },
        { id: 'needs-adjustment', label: '調整が必要' },
      ]);

      useAIChatStore.getState().addMessage(message);

      render(<AIChatInteraction messageId={message.id} enableTextFeedback />);

      fireEvent.click(screen.getByRole('button', { name: /調整が必要/ }));

      // テキスト入力フィールドが表示される
      expect(screen.getByPlaceholderText(/調整内容/)).toBeDefined();
    });
  });

  describe('accessibility', () => {
    it('should have proper aria-labels on buttons', () => {
      const message = createTestMessage('msg-10', 'rating', [
        { id: 'helpful', label: '参考になった', description: 'この分析は役に立ちました' },
      ]);

      useAIChatStore.getState().addMessage(message);

      render(<AIChatInteraction messageId={message.id} />);

      const button = screen.getByRole('button', { name: /この分析は役に立ちました/ });
      expect(button).toBeDefined();
    });

    it('should disable buttons after selection', () => {
      const message = createTestMessage('msg-11', 'rating', [
        { id: 'helpful', label: '参考になった' },
        { id: 'needs-adjustment', label: '調整が必要' },
      ]);

      useAIChatStore.getState().addMessage(message);

      render(<AIChatInteraction messageId={message.id} />);

      fireEvent.click(screen.getByRole('button', { name: /参考になった/ }));

      // 再レンダリング後、ボタンは非表示になるはず
      expect(screen.queryByRole('button')).toBeNull();
    });
  });
});
