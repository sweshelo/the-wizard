// src/ai/catalog/KeywordService.test.ts
import { describe, it, expect } from 'bun:test';
import { KeywordService } from './KeywordService';

describe('KeywordService', () => {
  const service = new KeywordService();

  describe('getKeywordDescription', () => {
    it('should return description for 不屈', () => {
      const desc = service.getKeywordDescription('不屈');

      expect(desc).toBeDefined();
      expect(desc).toContain('行動権');
    });

    it('should return description for 貫通', () => {
      const desc = service.getKeywordDescription('貫通');

      expect(desc).toBeDefined();
      expect(desc).toContain('ダメージ');
    });

    it('should return description for 加護', () => {
      const desc = service.getKeywordDescription('加護');

      expect(desc).toBeDefined();
      expect(desc).toContain('効果');
    });

    it('should return description for 固着', () => {
      const desc = service.getKeywordDescription('固着');

      expect(desc).toBeDefined();
    });

    it('should return description for 次元干渉', () => {
      const desc = service.getKeywordDescription('次元干渉');

      expect(desc).toBeDefined();
      expect(desc).toContain('コスト');
    });

    it('should return description for 沈黙', () => {
      const desc = service.getKeywordDescription('沈黙');

      expect(desc).toBeDefined();
      expect(desc).toContain('効果');
    });

    it('should return description for 強制防御', () => {
      const desc = service.getKeywordDescription('強制防御');

      expect(desc).toBeDefined();
      expect(desc).toContain('攻撃');
    });

    it('should return description for 不滅', () => {
      const desc = service.getKeywordDescription('不滅');

      expect(desc).toBeDefined();
    });

    it('should return undefined for unknown keyword', () => {
      const desc = service.getKeywordDescription('存在しないキーワード' as never);

      expect(desc).toBeUndefined();
    });
  });

  describe('getAllKeywords', () => {
    it('should return all keyword names', () => {
      const keywords = service.getAllKeywords();

      expect(Array.isArray(keywords)).toBe(true);
      expect(keywords.length).toBeGreaterThan(10);
      expect(keywords).toContain('不屈');
      expect(keywords).toContain('貫通');
      expect(keywords).toContain('加護');
    });
  });

  describe('extractKeywordsFromText', () => {
    it('should extract keywords from ability text', () => {
      const text = '【不屈】【貫通】このユニットが攻撃した時...';
      const keywords = service.extractKeywordsFromText(text);

      expect(keywords).toContain('不屈');
      expect(keywords).toContain('貫通');
    });

    it('should return empty array for text without keywords', () => {
      const text = 'このユニットがフィールドに出た時、カードを1枚引く。';
      const keywords = service.extractKeywordsFromText(text);

      expect(Array.isArray(keywords)).toBe(true);
    });

    it('should extract keywords without brackets', () => {
      const text = '不屈を持つユニットに貫通を付与する';
      const keywords = service.extractKeywordsFromText(text);

      expect(keywords).toContain('不屈');
      expect(keywords).toContain('貫通');
    });

    it('should not duplicate keywords', () => {
      const text = '【不屈】【不屈】を付与';
      const keywords = service.extractKeywordsFromText(text);

      const uniqeCount = keywords.filter(k => k === '不屈').length;
      expect(uniqeCount).toBe(1);
    });
  });

  describe('getKeywordsByCategory', () => {
    it('should categorize offensive keywords', () => {
      const offensive = service.getKeywordsByCategory('offensive');

      expect(offensive).toContain('貫通');
      expect(offensive).toContain('狂戦士');
    });

    it('should categorize defensive keywords', () => {
      const defensive = service.getKeywordsByCategory('defensive');

      expect(defensive).toContain('不屈');
      expect(defensive).toContain('加護');
      expect(defensive).toContain('不滅');
    });

    it('should categorize debuff keywords', () => {
      const debuff = service.getKeywordsByCategory('debuff');

      expect(debuff).toContain('沈黙');
      expect(debuff).toContain('呪縛');
      expect(debuff).toContain('行動制限');
    });
  });
});
