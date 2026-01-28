'use client';

import { useCallback, useState } from 'react';
import { PlayLimitService, type PlayCheckResponse } from '@/service/play-limit-service';

export type UsePlayLimitReturn = {
  playStatus: PlayCheckResponse | null;
  isLoading: boolean;
  error: string | null;
  checkCanPlay: () => Promise<PlayCheckResponse>;
  recordPlay: (deckId?: string, roomId?: string) => Promise<boolean>;
};

/**
 * プレイ回数制限を管理するフック
 */
export function usePlayLimit(): UsePlayLimitReturn {
  const [playStatus, setPlayStatus] = useState<PlayCheckResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkCanPlay = useCallback(async (): Promise<PlayCheckResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const status = await PlayLimitService.checkCanPlay();
      setPlayStatus(status);
      return status;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'プレイ状態の確認に失敗しました';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const recordPlay = useCallback(
    async (deckId?: string, roomId?: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await PlayLimitService.recordPlay({ deckId, roomId });

        if (result.success) {
          // プレイ状態を更新
          await checkCanPlay();
        }

        return result.success;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'プレイの記録に失敗しました';
        setError(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [checkCanPlay]
  );

  return {
    playStatus,
    isLoading,
    error,
    checkCanPlay,
    recordPlay,
  };
}
