'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/auth';

export const AuthStatus = () => {
  const { user, isLoading, isAuthSkipped, signOut } = useAuth();

  if (isLoading) {
    return (
      <div className="bg-gray-700 p-4 rounded-lg animate-pulse">
        <div className="h-6 bg-gray-600 rounded w-1/2"></div>
      </div>
    );
  }

  // 認証スキップモード
  if (isAuthSkipped) {
    return (
      <div className="bg-yellow-900 border border-yellow-600 p-4 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 font-medium">開発モード</span>
          <span className="text-yellow-200 text-sm">（認証スキップ）</span>
        </div>
      </div>
    );
  }

  // 未ログイン
  if (!user) {
    return (
      <div className="bg-gray-700 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-gray-300">ゲストモード</span>
          <Link
            href="/login"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm"
          >
            ログイン
          </Link>
        </div>
        <p className="text-gray-400 text-sm mt-2">ログインするとデッキをクラウドに保存できます</p>
      </div>
    );
  }

  // ログイン済み
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.user_metadata?.preferred_username ||
    'ユーザー';
  const avatarUrl = user.user_metadata?.avatar_url;

  return (
    <div className="bg-gray-700 p-4 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {avatarUrl && <img src={avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full" />}
          <div>
            <div className="text-white font-medium">{displayName}</div>
            <div className="text-gray-400 text-sm">Discord連携済み</div>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="px-3 py-1 bg-gray-600 text-gray-300 rounded-md hover:bg-gray-500 transition-colors text-sm"
        >
          ログアウト
        </button>
      </div>
    </div>
  );
};
