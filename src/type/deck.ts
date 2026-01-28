/**
 * デッキデータの型定義
 *
 * jokers フィールドがオプショナルなのは後方互換性のため。
 * JOKERは後から実装されたため、古いデータには存在しない場合がある。
 * DBへの移行時にjokersが存在しない場合は空配列として扱う。
 */
export type DeckData = {
  id: string;
  title: string;
  cards: string[]; // catalogId の配列（40枚）
  jokers?: string[]; // JOKER catalogId の配列（0-2枚）、後方互換性のためオプショナル
};

/**
 * JOKERが存在しない古いデータを正規化する
 * DBへの移行時などに使用
 */
export const normalizeDeckData = (deck: DeckData): Required<DeckData> => ({
  ...deck,
  jokers: deck.jokers ?? [],
});
