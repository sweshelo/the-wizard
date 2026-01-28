'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/auth';
import { redeemTicket } from '@/actions/play';

type TicketRedeemProps = {
  onSuccess?: () => void;
};

export const TicketRedeem = ({ onSuccess }: TicketRedeemProps) => {
  const { user, isAuthSkipped } = useAuth();
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // ログインしていない場合は表示しない
  if (!user && !isAuthSkipped) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    // 16桁バリデーション
    if (code.length !== 16) {
      setError('チケットコードは16桁で入力してください');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await redeemTicket(code.trim());

      if (result.success) {
        setSuccess(`${result.creditsAdded}クレジットをチャージしました！`);
        setCode('');
        onSuccess?.();
      } else {
        setError(result.message);
      }
    } catch {
      setError('チケットの使用に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // コードを正規化（大文字化、ハイフン/スペース除去）
  const handleCodeChange = (value: string) => {
    const normalized = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setCode(normalized);
  };

  // 4文字ごとにハイフンを入れて表示
  const formatCode = (code: string) => {
    return code.match(/.{1,4}/g)?.join('-') ?? code;
  };

  return (
    <div className="bg-gray-700 p-4 rounded-lg">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-white font-medium"
      >
        <span>チケットを使用</span>
        <span className="text-gray-400">{isExpanded ? '▲' : '▼'}</span>
      </button>

      {isExpanded && (
        <div className="mt-3">
          <form onSubmit={handleSubmit}>
            <div className="flex gap-2">
              <input
                type="text"
                value={formatCode(code)}
                onChange={e => handleCodeChange(e.target.value)}
                placeholder="チケットコードを入力"
                maxLength={19} // 16文字 + 3ハイフン
                className="flex-1 px-3 py-2 bg-gray-800 text-white rounded-md font-mono uppercase tracking-wider"
                disabled={isSubmitting}
              />
              <button
                type="submit"
                disabled={isSubmitting || code.length !== 16}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? '...' : '使用'}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-2 p-2 bg-red-900 border border-red-600 text-red-200 text-sm rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-2 p-2 bg-green-900 border border-green-600 text-green-200 text-sm rounded">
              {success}
            </div>
          )}

          <p className="mt-2 text-gray-400 text-xs">16桁のチケットコードを入力してください</p>
        </div>
      )}
    </div>
  );
};
