'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * ブラウザ用Supabaseクライアント
 * クライアントコンポーネントで使用
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
