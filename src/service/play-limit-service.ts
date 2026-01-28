import {
  checkCanPlay as checkCanPlayAction,
  getPlayStatus as getPlayStatusAction,
  recordPlay as recordPlayAction,
  redeemTicket as redeemTicketAction,
  type PlayStatusResponse,
  type PlayRecordRequest,
  type PlayRecordResponse,
  type RedeemTicketResponse,
} from '@/actions/play';

// 型を再エクスポート（後方互換性のためPlayCheckResponseも追加）
export type { PlayStatusResponse, PlayRecordRequest, PlayRecordResponse, RedeemTicketResponse };
export type PlayCheckResponse = PlayStatusResponse; // 後方互換性

/**
 * プレイ回数制限サービス
 * Server Actionsをラップして提供
 */
export const PlayLimitService = {
  /**
   * プレイ状態を取得（詳細情報付き）
   */
  getPlayStatus: getPlayStatusAction,

  /**
   * プレイ可能かどうかを確認（後方互換性用）
   */
  checkCanPlay: checkCanPlayAction,

  /**
   * プレイを記録
   */
  recordPlay: recordPlayAction,

  /**
   * チケットを使用してクレジットをチャージ
   */
  redeemTicket: redeemTicketAction,
};
