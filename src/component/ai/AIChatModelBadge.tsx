'use client';

// src/component/ai/AIChatModelBadge.tsx

import type { LLMModel } from '@/ai/types';

interface AIChatModelBadgeProps {
  model: LLMModel;
}

/**
 * モデルバッジ表示
 */
export function AIChatModelBadge({ model }: AIChatModelBadgeProps) {
  const { label, colorClass } = getModelConfig(model);

  return <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${colorClass}`}>{label}</span>;
}

/**
 * モデルの表示設定を取得
 */
function getModelConfig(model: LLMModel): { label: string; colorClass: string } {
  switch (model) {
    case 'haiku':
      return {
        label: 'Haiku',
        colorClass: 'bg-green-600/50 text-green-200',
      };
    case 'sonnet':
      return {
        label: 'Sonnet',
        colorClass: 'bg-blue-600/50 text-blue-200',
      };
    case 'opus':
      return {
        label: 'Opus',
        colorClass: 'bg-purple-600/50 text-purple-200',
      };
    default:
      return {
        label: model,
        colorClass: 'bg-gray-600/50 text-gray-200',
      };
  }
}
