'use client';

// src/component/ai/AIChat.tsx

import { useRef, useEffect } from 'react';
import { useAIChatStore } from '@/ai/chat/store';
import { AIChatMessage } from './AIChatMessage';
import { AIChatHeader } from './AIChatHeader';

/**
 * AIチャットメインコンテナ
 */
export function AIChat() {
  const { messages, settings } = useAIChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自動スクロール
  useEffect(() => {
    if (settings.autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, settings.autoScroll]);

  if (!settings.isVisible) {
    return <AIChatMinimized />;
  }

  const heightClass = {
    compact: 'h-32',
    normal: 'h-48',
    expanded: 'h-72',
  }[settings.height];

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-gray-900/95 border-t border-gray-700 ${heightClass} flex flex-col z-50`}
    >
      <AIChatHeader />
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
        {messages.length === 0 ? (
          <div className="text-gray-500 text-sm text-center py-4">
            AI思考ログがここに表示されます
          </div>
        ) : (
          messages
            .filter(msg => settings.showGameEvents || msg.category !== 'game_event')
            .map(message => (
              <AIChatMessage
                key={message.id}
                message={message}
                showDetails={settings.detailLevel === 'full'}
                showModelBadge={settings.showModelBadge}
              />
            ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

/**
 * 最小化時の表示
 */
function AIChatMinimized() {
  const { toggleVisibility, unreadCount } = useAIChatStore();

  return (
    <button
      type="button"
      onClick={toggleVisibility}
      aria-label="AIチャットを開く"
      className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full shadow-lg z-50 flex items-center gap-2"
    >
      <span>AI Chat</span>
      {unreadCount > 0 && (
        <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}
