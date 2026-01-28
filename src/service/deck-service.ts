import { createClient } from '@/lib/supabase/client';
import { LocalStorageHelper } from './local-storage';
import { normalizeDeckData, type DeckData } from '@/type/deck';
import type { Deck, DeckInsert, DeckUpdate } from '@/type/supabase';

/**
 * Deck（Supabase用）からDeckData（フロントエンド用）への変換
 */
const fromSupabaseDeck = (deck: Deck): DeckData => ({
  id: deck.id,
  title: deck.title,
  cards: deck.cards,
  jokers: deck.jokers,
});

/**
 * デッキサービス
 * ログイン状態に応じてSupabaseまたはLocalStorageを使い分ける
 */
export const DeckService = {
  /**
   * 全デッキを取得
   */
  async getAllDecks(userId: string | null): Promise<DeckData[]> {
    // ゲストモード
    if (!userId) {
      return LocalStorageHelper.getAllDecks();
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('decks')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('デッキ取得エラー:', error);
      throw error;
    }

    return (data ?? []).map(fromSupabaseDeck);
  },

  /**
   * メインデッキを取得
   */
  async getMainDeck(userId: string | null): Promise<DeckData | null> {
    // ゲストモード
    if (!userId) {
      return LocalStorageHelper.getMainDeck();
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('decks')
      .select('*')
      .eq('user_id', userId)
      .eq('is_main', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // メインデッキが設定されていない
        return null;
      }
      console.error('メインデッキ取得エラー:', error);
      throw error;
    }

    return data ? fromSupabaseDeck(data) : null;
  },

  /**
   * デッキを保存（新規または上書き）
   */
  async saveDeck(
    userId: string | null,
    title: string,
    cards: string[],
    jokers: string[] = [],
    isMain: boolean = false
  ): Promise<DeckData> {
    // ゲストモード
    if (!userId) {
      LocalStorageHelper.saveDeck(title, cards, jokers, isMain);
      const saved = LocalStorageHelper.getDeckByTitle(title);
      if (!saved) throw new Error('デッキの保存に失敗しました');
      return saved;
    }

    const supabase = createClient();

    // 既存のデッキを確認
    const { data: existing, error: existingError } = await supabase
      .from('decks')
      .select('id')
      .eq('user_id', userId)
      .eq('title', title)
      .maybeSingle();

    if (existingError) {
      console.error('既存デッキ確認エラー:', existingError);
      throw existingError;
    }

    if (existing) {
      // 更新
      const updateData: DeckUpdate = {
        cards,
        jokers,
        is_main: isMain,
      };

      const { data, error } = await supabase
        .from('decks')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('デッキ更新エラー:', error);
        throw error;
      }

      return fromSupabaseDeck(data);
    } else {
      // 新規作成
      const insertData: DeckInsert = {
        user_id: userId,
        title,
        cards,
        jokers,
        is_main: isMain,
      };

      const { data, error } = await supabase.from('decks').insert(insertData).select().single();

      if (error) {
        console.error('デッキ作成エラー:', error);
        throw error;
      }

      return fromSupabaseDeck(data);
    }
  },

  /**
   * デッキを削除
   */
  async deleteDeck(userId: string | null, deckId: string): Promise<void> {
    // ゲストモード
    if (!userId) {
      const deck = LocalStorageHelper.getDeckById(deckId);
      if (deck) {
        LocalStorageHelper.deleteDeck(deck.title);
      }
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from('decks').delete().eq('id', deckId).eq('user_id', userId);

    if (error) {
      console.error('デッキ削除エラー:', error);
      throw error;
    }
  },

  /**
   * メインデッキを設定
   */
  async setMainDeck(userId: string | null, deckId: string): Promise<void> {
    // ゲストモード
    if (!userId) {
      LocalStorageHelper.setMainDeckId(deckId);
      return;
    }

    const supabase = createClient();

    // トリガーで他のデッキのis_mainはfalseに自動更新される
    const { error } = await supabase
      .from('decks')
      .update({ is_main: true })
      .eq('id', deckId)
      .eq('user_id', userId);

    if (error) {
      console.error('メインデッキ設定エラー:', error);
      throw error;
    }
  },

  /**
   * LocalStorageからSupabaseへデッキを移行
   */
  async migrateFromLocalStorage(userId: string): Promise<{ success: number; failed: number }> {
    const localDecks = LocalStorageHelper.getAllDecks();
    const mainDeckId = LocalStorageHelper.getMainDeckId();

    let success = 0;
    let failed = 0;

    for (const deck of localDecks) {
      try {
        const normalized = normalizeDeckData(deck);
        const isMain = deck.id === mainDeckId;

        await this.saveDeck(userId, normalized.title, normalized.cards, normalized.jokers, isMain);

        success++;
      } catch (error) {
        console.error(`デッキ "${deck.title}" の移行に失敗:`, error);
        failed++;
      }
    }

    return { success, failed };
  },

  /**
   * LocalStorageのデッキをクリア
   */
  clearLocalStorage(): void {
    const decks = LocalStorageHelper.getAllDecks();
    for (const deck of decks) {
      LocalStorageHelper.deleteDeck(deck.title);
    }
  },
};
