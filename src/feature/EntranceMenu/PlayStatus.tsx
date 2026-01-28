'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/auth';
import { getPlayStatus, type PlayStatusResponse } from '@/actions/play';

export const PlayStatus = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [status, setStatus] = useState<PlayStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoading) {
      loadStatus();
    }
  }, [isAuthLoading, user]);

  const loadStatus = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getPlayStatus();
      setStatus(result);
    } catch (err) {
      console.error('プレイ状態取得エラー:', err);
      setError('プレイ状態の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || isAuthLoading) {
    return (
      <div className="bg-gray-700 p-4 rounded-lg animate-pulse">
        <div className="h-6 bg-gray-600 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-600 rounded w-3/4"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-700 p-4 rounded-lg">
        <div className="p-2 bg-red-900 border border-red-600 rounded text-red-200 text-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  // ゲストまたは開発モードの場合は簡易表示
  if (status.message?.includes('ゲスト') || status.message?.includes('開発')) {
    return (
      <div className="bg-gray-700 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-white font-medium">プレイ可能回数</span>
          <span className="text-green-400 font-bold">無制限</span>
        </div>
        <p className="text-gray-400 text-sm mt-1">{status.message}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-700 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white font-medium">プレイ可能回数</span>
        <span className={`font-bold ${status.canPlay ? 'text-green-400' : 'text-red-400'}`}>
          {status.totalRemaining}回
        </span>
      </div>

      <div className="space-y-1 text-sm">
        <div className="flex justify-between text-gray-400">
          <span>無料枠 (本日)</span>
          <span>
            {status.freeRemaining}/{status.dailyFreeLimit}回
          </span>
        </div>
        <div className="flex justify-between text-gray-400">
          <span>クレジット残高</span>
          <span>{status.credits}回分</span>
        </div>
      </div>

      {!status.canPlay && (
        <div className="mt-3 p-2 bg-red-900 border border-red-600 rounded text-red-200 text-sm">
          {status.message}
        </div>
      )}
    </div>
  );
};
