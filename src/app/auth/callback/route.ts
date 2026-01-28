import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * OAuth認証コールバック
 * Discord OAuthからのリダイレクトを処理し、セッションを確立する
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next') ?? '/entrance';
  // オープンリダイレクト脆弱性を防止：相対パスのみ許可、プロトコル相対URL(//)を拒否
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/entrance';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // 認証成功、リダイレクト先へ
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error('OAuth code exchange error:', error);
  }

  // 認証失敗、エラーページへリダイレクト
  return NextResponse.redirect(`${origin}/auth/error?message=認証に失敗しました`);
}
