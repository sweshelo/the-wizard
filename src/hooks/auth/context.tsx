'use client';

import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

/**
 * 認証スキップ時のモックユーザー
 */
const MOCK_USER: User = {
  id: 'mock-user-id',
  app_metadata: {},
  user_metadata: {
    avatar_url: '',
    full_name: 'ローカル開発ユーザー',
    name: 'ローカル開発ユーザー',
    preferred_username: 'local_dev',
    provider_id: 'mock-discord-id',
  },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

export type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthSkipped: boolean;
  signInWithDiscord: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthSkipped = process.env.NEXT_PUBLIC_AUTH_SKIP === 'true';

  useEffect(() => {
    // 認証スキップモードの場合
    if (isAuthSkipped) {
      setUser(MOCK_USER);
      setSession(null);
      setIsLoading(false);
      return;
    }

    // Supabase環境変数が設定されていない場合
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase環境変数が設定されていません。認証機能は無効です。');
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    // 初期セッションを取得
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('セッション取得エラー:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isAuthSkipped]);

  const signInWithDiscord = useCallback(async () => {
    if (isAuthSkipped) {
      // スキップモードでは何もしない
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('Discordログインエラー:', error);
      throw error;
    }
  }, [isAuthSkipped]);

  const signOut = useCallback(async () => {
    if (isAuthSkipped) {
      // スキップモードでは何もしない
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('ログアウトエラー:', error);
      throw error;
    }
  }, [isAuthSkipped]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthSkipped,
        signInWithDiscord,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
