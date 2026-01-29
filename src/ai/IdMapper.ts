// src/ai/IdMapper.ts

/**
 * ユニットID・カードIDを短縮IDにマッピングするクラス
 * LLMへの送信時に長いUUIDを短縮し、応答を解析する際に復元する
 */
export class IdMapper {
  private unitMap: Map<string, string> = new Map();
  private unitReverseMap: Map<string, string> = new Map();
  private cardMap: Map<string, string> = new Map();
  private cardReverseMap: Map<string, string> = new Map();
  private unitCounter = 0;
  private cardCounter = 0;

  /**
   * ユニットIDを短縮IDに変換
   * @param originalId 元のユニットID
   * @returns 短縮ID (u1, u2, ...)
   */
  shortenUnit(originalId: string): string {
    const existing = this.unitMap.get(originalId);
    if (existing) {
      return existing;
    }
    this.unitCounter++;
    const shortId = `u${this.unitCounter}`;
    this.unitMap.set(originalId, shortId);
    this.unitReverseMap.set(shortId, originalId);
    return shortId;
  }

  /**
   * カードIDを短縮IDに変換
   * @param originalId 元のカードID
   * @returns 短縮ID (c1, c2, ...)
   */
  shortenCard(originalId: string): string {
    const existing = this.cardMap.get(originalId);
    if (existing) {
      return existing;
    }
    this.cardCounter++;
    const shortId = `c${this.cardCounter}`;
    this.cardMap.set(originalId, shortId);
    this.cardReverseMap.set(shortId, originalId);
    return shortId;
  }

  /**
   * 短縮ユニットIDから元のIDを復元
   * @param shortId 短縮ID
   * @returns 元のID、または見つからない場合はundefined
   */
  restoreUnit(shortId: string): string | undefined {
    return this.unitReverseMap.get(shortId);
  }

  /**
   * 短縮カードIDから元のIDを復元
   * @param shortId 短縮ID
   * @returns 元のID、または見つからない場合はundefined
   */
  restoreCard(shortId: string): string | undefined {
    return this.cardReverseMap.get(shortId);
  }

  /**
   * 短縮IDから元のIDを復元（プレフィックスで自動判別）
   * @param shortId 短縮ID
   * @returns 元のID、または見つからない場合はundefined
   */
  restore(shortId: string): string | undefined {
    if (shortId.startsWith('u')) {
      return this.restoreUnit(shortId);
    }
    if (shortId.startsWith('c')) {
      return this.restoreCard(shortId);
    }
    return undefined;
  }

  /**
   * すべてのマッピングをクリア
   */
  reset(): void {
    this.unitMap.clear();
    this.unitReverseMap.clear();
    this.cardMap.clear();
    this.cardReverseMap.clear();
    this.unitCounter = 0;
    this.cardCounter = 0;
  }
}
