'use client';

// src/component/ai/AIChatHeader.tsx

import { useAIChatStore } from '@/ai/chat/store';

/**
 * AIチャットヘッダー
 */
export function AIChatHeader() {
  const { settings, updateSettings, toggleVisibility, clearMessages } = useAIChatStore();

  const handleHeightChange = () => {
    const heights: Array<'compact' | 'normal' | 'expanded'> = ['compact', 'normal', 'expanded'];
    const currentIndex = heights.indexOf(settings.height);
    const nextIndex = (currentIndex + 1) % heights.length;
    updateSettings({ height: heights[nextIndex] });
  };

  const handleDetailToggle = () => {
    updateSettings({
      detailLevel: settings.detailLevel === 'full' ? 'summary' : 'full',
    });
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-gray-800">
      <div className="flex items-center gap-2">
        <span className="text-white font-medium">AI Chat</span>
        <span className="text-gray-400 text-xs">
          ({settings.height === 'compact' ? '小' : settings.height === 'normal' ? '中' : '大'})
        </span>
      </div>
      <div className="flex items-center gap-2">
        {/* 詳細表示切り替え */}
        <button
          onClick={handleDetailToggle}
          className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded hover:bg-gray-700"
          title={settings.detailLevel === 'full' ? '要約表示に切り替え' : '詳細表示に切り替え'}
        >
          {settings.detailLevel === 'full' ? '要約' : '詳細'}
        </button>
        {/* 高さ変更 */}
        <button
          onClick={handleHeightChange}
          className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded hover:bg-gray-700"
          title="表示サイズを変更"
        >
          <HeightIcon />
        </button>
        {/* クリア */}
        <button
          onClick={clearMessages}
          className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded hover:bg-gray-700"
          title="ログをクリア"
        >
          <ClearIcon />
        </button>
        {/* 最小化 */}
        <button
          onClick={toggleVisibility}
          className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded hover:bg-gray-700"
          title="最小化"
        >
          <MinimizeIcon />
        </button>
      </div>
    </div>
  );
}

function HeightIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
      />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

function MinimizeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
    </svg>
  );
}
