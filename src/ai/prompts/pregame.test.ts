// src/ai/prompts/pregame.test.ts
import { describe, it, expect } from 'bun:test';
import {
  PREGAME_SYSTEM_PROMPT,
  buildPregamePrompt,
  type DeckInfo,
  type PregamePromptResponse,
} from './pregame';

describe('Pregame Prompts', () => {
  describe('PREGAME_SYSTEM_PROMPT', () => {
    it('should include analysis instructions', () => {
      expect(PREGAME_SYSTEM_PROMPT).toContain('分析');
    });

    it('should mention deck composition', () => {
      expect(PREGAME_SYSTEM_PROMPT).toContain('デッキ');
    });

    it('should request JSON response', () => {
      expect(PREGAME_SYSTEM_PROMPT).toContain('JSON');
    });
  });

  describe('buildPregamePrompt', () => {
    const sampleDeck: DeckInfo = {
      cards: [
        { catalogId: '1-0-001', name: 'ユニットA', type: 'unit', cost: 2, count: 3 },
        { catalogId: '1-0-002', name: 'ユニットB', type: 'unit', cost: 3, count: 2 },
        { catalogId: '1-0-100', name: 'インターセプトA', type: 'intercept', cost: 1, count: 3 },
        { catalogId: '1-0-200', name: 'トリガーA', type: 'trigger', cost: 0, count: 2 },
      ],
      colors: [1],
      totalCards: 40,
    };

    it('should include deck card list', () => {
      const prompt = buildPregamePrompt(sampleDeck);

      expect(prompt).toContain('ユニットA');
      expect(prompt).toContain('ユニットB');
    });

    it('should include card types', () => {
      const prompt = buildPregamePrompt(sampleDeck);

      expect(prompt).toContain('ユニット');
      expect(prompt).toContain('インターセプト');
      expect(prompt).toContain('トリガー');
    });

    it('should include card costs', () => {
      const prompt = buildPregamePrompt(sampleDeck);

      expect(prompt).toContain('コスト');
    });

    it('should include deck color information', () => {
      const prompt = buildPregamePrompt(sampleDeck);

      expect(prompt).toContain('赤');
    });

    it('should include card counts', () => {
      const prompt = buildPregamePrompt(sampleDeck);

      expect(prompt).toContain('3枚');
      expect(prompt).toContain('2枚');
    });

    it('should format as structured analysis request', () => {
      const prompt = buildPregamePrompt(sampleDeck);

      expect(prompt).toContain('## デッキ構成');
    });
  });

  describe('PregamePromptResponse type', () => {
    it('should define required fields', () => {
      const response: PregamePromptResponse = {
        deckArchetype: 'アグロ',
        keyCards: ['ユニットA', 'ユニットB'],
        strategy: '序盤から攻撃的に展開する',
        mulliganAdvice: '低コストユニットを優先',
        strengths: ['速攻性能が高い'],
        weaknesses: ['長期戦に弱い'],
        matchupNotes: '相手が遅いデッキなら有利',
      };

      expect(response.deckArchetype).toBeDefined();
      expect(response.keyCards).toBeArray();
      expect(response.strategy).toBeDefined();
    });
  });
});
