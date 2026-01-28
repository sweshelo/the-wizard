'use server';

import { createClient } from '@/lib/supabase/server';

// ===== 型定義 =====

export type PlayStatusResponse = {
  canPlay: boolean;
  dailyFreeLimit: number;
  todayFreeUsed: number;
  freeRemaining: number;
  credits: number;
  totalRemaining: number;
  message?: string;
};

export type PlayRecordRequest = {
  deckId?: string;
  roomId?: string;
};

export type PlayRecordResponse = {
  success: boolean;
  consumptionType?: 'free' | 'credit';
  playLogId?: string;
  message?: string;
};

export type RedeemTicketResponse = {
  success: boolean;
  creditsAdded?: number;
  message: string;
};

// ===== Server Actions =====

/**
 * プレイ状態を取得（詳細情報付き）
 */
export async function getPlayStatus(): Promise<PlayStatusResponse> {
  // 認証スキップモードの場合
  if (process.env.AUTH_SKIP === 'true') {
    return {
      canPlay: true,
      dailyFreeLimit: 999,
      todayFreeUsed: 0,
      freeRemaining: 999,
      credits: 999,
      totalRemaining: 999,
      message: '開発モード: 制限なし',
    };
  }

  try {
    const supabase = await createClient();

    // 現在のユーザーを取得
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      // 未ログインユーザーはゲストとして制限なし
      return {
        canPlay: true,
        dailyFreeLimit: 999,
        todayFreeUsed: 0,
        freeRemaining: 999,
        credits: 0,
        totalRemaining: 999,
        message: 'ゲストモード: 制限なし',
      };
    }

    // 各種情報を取得
    const [dailyFreeResult, todayFreeResult, creditsResult] = await Promise.all([
      supabase.rpc('get_daily_free_plays'),
      supabase.rpc('get_today_free_play_count', { p_user_id: user.id }),
      supabase.rpc('get_user_credits', { p_user_id: user.id }),
    ]);

    // Check for RPC errors
    if (dailyFreeResult.error || todayFreeResult.error || creditsResult.error) {
      console.error('RPC呼び出しエラー:', {
        dailyFree: dailyFreeResult.error,
        todayFree: todayFreeResult.error,
        credits: creditsResult.error,
      });
      return {
        canPlay: false,
        dailyFreeLimit: 0,
        todayFreeUsed: 0,
        freeRemaining: 0,
        credits: 0,
        totalRemaining: 0,
        message: 'プレイ状態の取得に失敗しました',
      };
    }

    const dailyFreeLimit = dailyFreeResult.data ?? 3;
    const todayFreeUsed = todayFreeResult.data ?? 0;
    const credits = creditsResult.data ?? 0;

    const freeRemaining = Math.max(0, dailyFreeLimit - todayFreeUsed);
    const totalRemaining = freeRemaining + credits;
    const canPlay = totalRemaining > 0;

    return {
      canPlay,
      dailyFreeLimit,
      todayFreeUsed,
      freeRemaining,
      credits,
      totalRemaining,
      message: canPlay ? undefined : 'プレイ可能回数がありません',
    };
  } catch (error) {
    console.error('プレイ状態取得エラー:', error);
    throw new Error('プレイ状態の取得に失敗しました');
  }
}

/**
 * プレイ可能かどうかを確認（シンプル版、後方互換性用）
 */
export async function checkCanPlay(): Promise<PlayStatusResponse> {
  return getPlayStatus();
}

/**
 * プレイを記録（クレジット消費）
 */
export async function recordPlay(params?: PlayRecordRequest): Promise<PlayRecordResponse> {
  // 認証スキップモードの場合は記録しない
  if (process.env.AUTH_SKIP === 'true') {
    return {
      success: true,
      consumptionType: 'free',
      message: '開発モード: 記録スキップ',
    };
  }

  try {
    const supabase = await createClient();

    // 現在のユーザーを取得
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      // 未ログインユーザーは記録しない（ゲスト許可モード）
      return {
        success: true,
        consumptionType: 'free',
        message: 'ゲストモード: 記録スキップ',
      };
    }

    // クレジットを消費してプレイを記録
    const { data, error } = await supabase.rpc('consume_play_credit', {
      p_user_id: user.id,
      p_deck_id: params?.deckId || null,
      p_room_id: params?.roomId || null,
    });

    if (error) {
      console.error('プレイ記録エラー:', error);
      throw new Error('プレイの記録に失敗しました');
    }

    const result = data?.[0];
    if (!result?.success) {
      return {
        success: false,
        message: 'プレイ可能回数がありません',
      };
    }

    return {
      success: true,
      consumptionType: result.consumption_type as 'free' | 'credit',
      playLogId: result.play_log_id,
    };
  } catch (error) {
    console.error('プレイ記録エラー:', error);
    throw new Error('プレイの記録に失敗しました');
  }
}

/**
 * チケットを使用してクレジットをチャージ
 */
export async function redeemTicket(code: string): Promise<RedeemTicketResponse> {
  // 認証スキップモードの場合
  if (process.env.AUTH_SKIP === 'true') {
    return {
      success: true,
      creditsAdded: 10,
      message: '開発モード: チケット使用成功',
    };
  }

  try {
    const supabase = await createClient();

    // 現在のユーザーを取得
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: 'ログインが必要です',
      };
    }

    // チケットを使用
    const { data, error } = await supabase.rpc('redeem_ticket', {
      p_user_id: user.id,
      p_code: code.toUpperCase().replace(/[^A-Z0-9]/g, ''), // 正規化
    });

    if (error) {
      console.error('チケット使用エラー:', error);
      throw new Error('チケットの使用に失敗しました');
    }

    const result = data?.[0];
    return {
      success: result?.success ?? false,
      creditsAdded: result?.credits_added,
      message: result?.message ?? 'エラーが発生しました',
    };
  } catch (error) {
    console.error('チケット使用エラー:', error);
    throw new Error('チケットの使用に失敗しました');
  }
}
