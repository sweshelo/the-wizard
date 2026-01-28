'use server';

import { createClient } from '@/lib/supabase/server';
import type { Ticket, Profile } from '@/type/supabase';

// ===== 型定義 =====

export type AdminCheckResponse = {
  isAdmin: boolean;
  message?: string;
};

export type SystemConfigResponse = {
  dailyFreePlays: number;
};

export type TicketListResponse = {
  tickets: Ticket[];
  total: number;
};

export type CreateTicketRequest = {
  credits: number;
  count: number; // 一括発行数
  expiresAt?: string | null; // ISO 8601形式、null=永久
};

export type CreateTicketResponse = {
  success: boolean;
  tickets: { id: string; code: string }[];
  message?: string;
};

export type UserListResponse = {
  users: (Profile & { credits: number })[];
  total: number;
};

// ===== ヘルパー =====

async function checkAdminAccess(): Promise<{ userId: string } | { error: string }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'ログインが必要です' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('プロファイル取得エラー:', profileError);
    return { error: 'プロファイルの取得に失敗しました' };
  }

  if (!profile?.is_admin) {
    return { error: '管理者権限が必要です' };
  }

  return { userId: user.id };
}

// ===== Server Actions =====

/**
 * 管理者かどうかを確認
 */
export async function checkIsAdmin(): Promise<AdminCheckResponse> {
  if (process.env.AUTH_SKIP === 'true') {
    return { isAdmin: true, message: '開発モード' };
  }

  const result = await checkAdminAccess();
  if ('error' in result) {
    return { isAdmin: false, message: result.error };
  }

  return { isAdmin: true };
}

/**
 * システム設定を取得
 */
export async function getSystemConfig(): Promise<SystemConfigResponse> {
  if (process.env.AUTH_SKIP === 'true') {
    return { dailyFreePlays: 3 };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('system_config')
    .select('value')
    .eq('key', 'daily_free_plays')
    .single();

  if (error) {
    console.error('システム設定取得エラー:', error);
  }

  return {
    dailyFreePlays: (data?.value as number) ?? 3,
  };
}

/**
 * 1日の無料プレイ回数を更新
 */
export async function updateDailyFreePlays(
  value: number
): Promise<{ success: boolean; message?: string }> {
  if (process.env.AUTH_SKIP === 'true') {
    return { success: true, message: '開発モード' };
  }

  const adminCheck = await checkAdminAccess();
  if ('error' in adminCheck) {
    return { success: false, message: adminCheck.error };
  }

  if (value < 0 || value > 100) {
    return { success: false, message: '値は0〜100の範囲で指定してください' };
  }

  const supabase = await createClient();

  const { error } = await supabase.from('system_config').upsert({ key: 'daily_free_plays', value });

  if (error) {
    console.error('設定更新エラー:', error);
    return { success: false, message: '設定の更新に失敗しました' };
  }

  return { success: true };
}

/**
 * チケット一覧を取得
 */
export async function getTickets(options?: {
  page?: number;
  limit?: number;
  showUsed?: boolean;
}): Promise<TicketListResponse> {
  if (process.env.AUTH_SKIP === 'true') {
    return { tickets: [], total: 0 };
  }

  const adminCheck = await checkAdminAccess();
  if ('error' in adminCheck) {
    return { tickets: [], total: 0 };
  }

  const page = options?.page ?? 1;
  const limit = options?.limit ?? 50;
  const showUsed = options?.showUsed ?? true;
  const offset = (page - 1) * limit;

  const supabase = await createClient();

  let query = supabase
    .from('tickets')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (!showUsed) {
    query = query.is('owner_id', null);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error('チケット取得エラー:', error);
    return { tickets: [], total: 0 };
  }

  return {
    tickets: data ?? [],
    total: count ?? 0,
  };
}

/**
 * チケットを発行（一括発行対応）
 */
export async function createTickets(request: CreateTicketRequest): Promise<CreateTicketResponse> {
  if (process.env.AUTH_SKIP === 'true') {
    return {
      success: true,
      tickets: Array.from({ length: request.count }, (_, i) => ({
        id: `mock-${i}`,
        code: `MOCK${String(i).padStart(12, '0')}`,
      })),
      message: '開発モード',
    };
  }

  const adminCheck = await checkAdminAccess();
  if ('error' in adminCheck) {
    return { success: false, tickets: [], message: adminCheck.error };
  }

  if (request.credits < 1 || request.credits > 1000) {
    return {
      success: false,
      tickets: [],
      message: 'クレジット数は1〜1000の範囲で指定してください',
    };
  }

  if (request.count < 1 || request.count > 100) {
    return { success: false, tickets: [], message: '発行数は1〜100の範囲で指定してください' };
  }

  const supabase = await createClient();
  const tickets: { id: string; code: string }[] = [];

  // 有効期限を計算
  const expiresAt =
    request.expiresAt === null
      ? null
      : (request.expiresAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());

  for (let i = 0; i < request.count; i++) {
    const { data, error } = await supabase.rpc('create_ticket', {
      p_credits: request.credits,
      p_expires_at: expiresAt,
    });

    if (error) {
      console.error('チケット発行エラー:', error);
      continue;
    }

    const result = data?.[0];
    if (result) {
      tickets.push({ id: result.id, code: result.code });
    }
  }

  return {
    success: tickets.length > 0,
    tickets,
    message:
      tickets.length === request.count
        ? undefined
        : `${tickets.length}/${request.count}件のチケットを発行しました`,
  };
}

/**
 * ユーザー一覧を取得（管理者ダッシュボード用）
 */
export async function getUsers(options?: {
  page?: number;
  limit?: number;
}): Promise<UserListResponse> {
  if (process.env.AUTH_SKIP === 'true') {
    return { users: [], total: 0 };
  }

  const adminCheck = await checkAdminAccess();
  if ('error' in adminCheck) {
    return { users: [], total: 0 };
  }

  const page = options?.page ?? 1;
  const limit = options?.limit ?? 50;
  const offset = (page - 1) * limit;

  const supabase = await createClient();

  const {
    data: profiles,
    count,
    error,
  } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('ユーザー取得エラー:', error);
    return { users: [], total: 0 };
  }

  // 各ユーザーのクレジット残高を取得
  const usersWithCredits = await Promise.all(
    (profiles ?? []).map(async profile => {
      const { data: credits } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', profile.id)
        .single();

      return {
        ...profile,
        credits: credits?.balance ?? 0,
      };
    })
  );

  return {
    users: usersWithCredits,
    total: count ?? 0,
  };
}

/**
 * ユーザーの管理者権限を変更
 */
export async function setUserAdmin(
  userId: string,
  isAdmin: boolean
): Promise<{ success: boolean; message?: string }> {
  if (process.env.AUTH_SKIP === 'true') {
    return { success: true, message: '開発モード' };
  }

  const adminCheck = await checkAdminAccess();
  if ('error' in adminCheck) {
    return { success: false, message: adminCheck.error };
  }

  const supabase = await createClient();

  const { error } = await supabase.from('profiles').update({ is_admin: isAdmin }).eq('id', userId);

  if (error) {
    console.error('権限更新エラー:', error);
    return { success: false, message: '権限の更新に失敗しました' };
  }

  return { success: true };
}
