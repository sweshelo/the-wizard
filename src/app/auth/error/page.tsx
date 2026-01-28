'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message') ?? '認証中にエラーが発生しました';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg max-w-md w-full mx-4 text-center">
        <div className="text-red-400 text-6xl mb-4">!</div>
        <h1 className="text-2xl font-bold text-white mb-4">認証エラー</h1>
        <p className="text-gray-400 mb-6">{message}</p>
        <div className="space-y-3">
          <Link
            href="/login"
            className="block w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            もう一度ログイン
          </Link>
          <Link
            href="/entrance"
            className="block w-full px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            エントランスへ戻る
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}
