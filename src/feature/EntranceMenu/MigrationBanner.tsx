'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/auth';
import { useDeck } from '@/hooks/deck';

export const MigrationBanner = () => {
  const { user } = useAuth();
  const { hasLocalDecks, migrateFromLocalStorage, clearLocalStorage, refreshDecks } = useDeck();
  const [isMigrating, setIsMigrating] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // ログインしていない、またはローカルデッキがない場合は表示しない
  if (!user || !hasLocalDecks) {
    return null;
  }

  const handleMigrate = async () => {
    setIsMigrating(true);
    setResult(null);

    try {
      const migrationResult = await migrateFromLocalStorage();
      setResult(migrationResult);

      if (migrationResult.success > 0) {
        setShowConfirm(true);
      }
    } catch (error) {
      console.error('マイグレーションエラー:', error);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleClearLocal = () => {
    clearLocalStorage();
    setShowConfirm(false);
    setResult(null);
    refreshDecks();
  };

  const handleKeepLocal = () => {
    setShowConfirm(false);
    setResult(null);
  };

  return (
    <div className="bg-blue-900 border border-blue-600 p-4 rounded-lg">
      <h4 className="text-blue-200 font-medium mb-2">ローカルデッキが見つかりました</h4>

      {!result && (
        <>
          <p className="text-blue-300 text-sm mb-3">
            ブラウザに保存されているデッキをクラウドに移行できます。
            移行すると、どのデバイスからでもデッキにアクセスできます。
          </p>
          <button
            onClick={handleMigrate}
            disabled={isMigrating}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            {isMigrating ? '移行中...' : 'クラウドに移行'}
          </button>
        </>
      )}

      {result && !showConfirm && (
        <div className="text-blue-200">
          <p>移行完了: {result.success}件成功</p>
          {result.failed > 0 && <p className="text-yellow-400">{result.failed}件失敗</p>}
        </div>
      )}

      {showConfirm && (
        <div className="mt-3">
          <p className="text-blue-200 text-sm mb-3">
            ローカルのデッキデータを削除しますか？
            <br />
            <span className="text-gray-400">
              （削除しなくても、今後はクラウドのデータが使用されます）
            </span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleClearLocal}
              className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
            >
              ローカルを削除
            </button>
            <button
              onClick={handleKeepLocal}
              className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors text-sm"
            >
              そのまま残す
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
