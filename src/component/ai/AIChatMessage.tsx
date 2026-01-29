'use client';

// src/component/ai/AIChatMessage.tsx

import type { AIChatMessage as AIChatMessageType } from '@/ai/chat/types';
import { AIChatModelBadge } from './AIChatModelBadge';

interface AIChatMessageProps {
  message: AIChatMessageType;
  showDetails: boolean;
  showModelBadge: boolean;
}

/**
 * AIチャットメッセージ
 */
export function AIChatMessage({ message, showDetails, showModelBadge }: AIChatMessageProps) {
  const { category, content, meta, priority } = message;

  // カテゴリに応じた背景色
  const bgColorClass = getBgColorClass(priority, category);

  // ゲームイベントは簡略表示
  if (category === 'game_event') {
    return (
      <div className="text-gray-400 text-xs px-2 py-1 border-l-2 border-gray-600 opacity-70">
        <span className="text-gray-500">[evt]</span> {content.body}
      </div>
    );
  }

  return (
    <div className={`${bgColorClass} rounded px-3 py-2 text-sm`}>
      <div className="flex items-center gap-2 mb-1">
        {showModelBadge && <AIChatModelBadge model={meta.model} />}
        <span className="text-gray-400 text-xs">{formatTime(message.timestamp)}</span>
        <span className="text-white font-medium">{content.title}</span>
      </div>
      <div className="text-gray-200">{content.body}</div>
      {showDetails && content.details && content.details.length > 0 && (
        <div className="mt-2 space-y-1">
          {content.details.map((detail, index) => (
            <div key={index} className="text-xs flex gap-2">
              <span className={getDetailLabelClass(detail.type)}>{detail.label}:</span>
              <span className={getDetailValueClass(detail.type)}>{detail.value}</span>
            </div>
          ))}
        </div>
      )}
      {message.interaction &&
        message.interaction.type !== 'none' &&
        !message.interaction.selected && <MessageInteraction message={message} />}
    </div>
  );
}

/**
 * 優先度とカテゴリに基づいて背景色クラスを取得
 */
function getBgColorClass(priority: string, category: string): string {
  if (category === 'system') {
    return 'bg-gray-800/50';
  }

  switch (priority) {
    case 'high':
      return 'bg-red-900/30 border-l-2 border-red-500';
    case 'medium':
      return 'bg-yellow-900/20 border-l-2 border-yellow-600';
    case 'low':
      return 'bg-blue-900/20 border-l-2 border-blue-600';
    default:
      return 'bg-gray-800/50';
  }
}

/**
 * 詳細ラベルのクラスを取得
 */
function getDetailLabelClass(type: string): string {
  switch (type) {
    case 'warning':
      return 'text-red-400';
    case 'card':
    case 'unit':
      return 'text-blue-400';
    case 'keyword':
      return 'text-purple-400';
    default:
      return 'text-gray-400';
  }
}

/**
 * 詳細値のクラスを取得
 */
function getDetailValueClass(type: string): string {
  switch (type) {
    case 'warning':
      return 'text-red-300';
    case 'card':
    case 'unit':
      return 'text-blue-300';
    case 'keyword':
      return 'text-purple-300';
    default:
      return 'text-gray-300';
  }
}

/**
 * 時刻をフォーマット
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * メッセージインタラクション
 */
function MessageInteraction({ message }: { message: AIChatMessageType }) {
  const { interaction } = message;
  if (!interaction || interaction.type === 'none') return null;

  return (
    <div className="mt-2 flex gap-2 flex-wrap">
      {interaction.options?.map(option => (
        <button
          key={option.id}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded"
          title={option.description}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
