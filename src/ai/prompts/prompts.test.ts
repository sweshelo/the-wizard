// src/ai/prompts/prompts.test.ts

import { describe, it, expect } from 'bun:test';
import { SYSTEM_PROMPT, getSystemPrompt, formatGameStateDescription } from './system';
import { MULLIGAN_SYSTEM_PROMPT, buildMulliganPrompt } from './mulligan';
import { ACTION_SYSTEM_PROMPT, buildActionPrompt } from './action';
import {
  CHOICE_SYSTEM_PROMPT,
  buildOptionChoicePrompt,
  buildCardChoicePrompt,
  buildUnitChoicePrompt,
  buildBlockChoicePrompt,
  buildInterceptChoicePrompt,
} from './choice';
import type { AIGameContext, CompactCard, CompactUnit } from '../types';

// テスト用のモックデータ
const createMockContext = (): AIGameContext => ({
  turn: 3,
  round: 2,
  isMyTurn: true,
  self: {
    life: 7,
    cp: { current: 4, max: 5 },
    jokerGauge: 2,
    handCount: 4,
    deckCount: 30,
  },
  opponent: {
    life: 6,
    cp: { current: 3, max: 5 },
    jokerGauge: 3,
    handCount: 5,
    deckCount: 28,
  },
  myField: [
    {
      id: 'u1',
      name: '竜騎兵',
      catalogId: 'CAT001',
      bp: 5000,
      baseBp: 5000,
      cost: 3,
      active: true,
      abilities: [],
      canBoot: false,
    },
  ],
  opponentField: [
    {
      id: 'u2',
      name: '魔術師',
      catalogId: 'CAT002',
      bp: 4000,
      baseBp: 4000,
      cost: 2,
      active: false,
      abilities: ['加護'],
      canBoot: false,
    },
  ],
  myHand: [
    {
      id: 'c1',
      name: '炎の槍',
      catalogId: 'CAT003',
      cost: 2,
      type: 'intercept',
      playable: true,
    },
    {
      id: 'c2',
      name: '進化の秘宝',
      catalogId: 'CAT004',
      cost: 3,
      type: 'trigger',
      playable: true,
    },
  ],
  myTrigger: [],
  recentEvents: [],
});

describe('System Prompt', () => {
  it('should have basic game rules', () => {
    expect(SYSTEM_PROMPT).toContain('CODE OF JOKER');
    expect(SYSTEM_PROMPT).toContain('8ライフ');
    expect(SYSTEM_PROMPT).toContain('JSON');
  });

  it('should return detailed prompt when requested', () => {
    const simple = getSystemPrompt(false);
    const detailed = getSystemPrompt(true);

    expect(detailed.length).toBeGreaterThan(simple.length);
    expect(detailed).toContain('ゲーム状態の読み方');
  });

  it('should format game state description', () => {
    const description = formatGameStateDescription();

    expect(description).toContain('turn');
    expect(description).toContain('life');
    expect(description).toContain('myField');
  });
});

describe('Mulligan Prompt', () => {
  it('should have mulligan criteria', () => {
    expect(MULLIGAN_SYSTEM_PROMPT).toContain('マリガン');
    expect(MULLIGAN_SYSTEM_PROMPT).toContain('低コスト');
    expect(MULLIGAN_SYSTEM_PROMPT).toContain('shouldMulligan');
  });

  it('should build mulligan prompt with hand info', () => {
    const context = createMockContext();
    const prompt = buildMulliganPrompt(context);

    expect(prompt).toContain('現在の手札');
    expect(prompt).toContain('コスト分布');
    expect(prompt).toContain('JSON形式');
  });

  it('should handle empty hand', () => {
    const context = createMockContext();
    context.myHand = [];
    const prompt = buildMulliganPrompt(context);

    expect(prompt).toContain('手札なし');
  });
});

describe('Action Prompt', () => {
  it('should have action types', () => {
    expect(ACTION_SYSTEM_PROMPT).toContain('UnitDrive');
    expect(ACTION_SYSTEM_PROMPT).toContain('TurnEnd');
    expect(ACTION_SYSTEM_PROMPT).toContain('アクション');
  });

  it('should build action prompt with game state', () => {
    const context = createMockContext();
    const prompt = buildActionPrompt(context);

    expect(prompt).toContain('ゲーム状況');
    expect(prompt).toContain('ターン: 3');
    expect(prompt).toContain('フィールド状況');
    expect(prompt).toContain('竜騎兵');
    expect(prompt).toContain('手札');
  });

  it('should show playable status', () => {
    const context = createMockContext();
    const prompt = buildActionPrompt(context);

    expect(prompt).toContain('プレイ可能');
  });
});

describe('Choice Prompts', () => {
  describe('buildOptionChoicePrompt', () => {
    it('should format options', () => {
      const context = createMockContext();
      const options = [
        { id: 'opt1', description: 'はい' },
        { id: 'opt2', description: 'いいえ' },
      ];
      const prompt = buildOptionChoicePrompt(context, options, '確認');

      expect(prompt).toContain('選択肢: 確認');
      expect(prompt).toContain('[opt1] はい');
      expect(prompt).toContain('[opt2] いいえ');
    });
  });

  describe('buildCardChoicePrompt', () => {
    it('should format card selection', () => {
      const context = createMockContext();
      const cards: CompactCard[] = [
        { id: 'c1', name: 'カード1', catalogId: 'CAT1', cost: 2, type: 'unit', playable: true },
        {
          id: 'c2',
          name: 'カード2',
          catalogId: 'CAT2',
          cost: 3,
          type: 'intercept',
          playable: true,
        },
      ];
      const prompt = buildCardChoicePrompt(context, cards, 1, 'カードを選択');

      expect(prompt).toContain('カード選択: カードを選択');
      expect(prompt).toContain('[c1] カード1');
      expect(prompt).toContain('選択枚数: 1枚');
    });
  });

  describe('buildUnitChoicePrompt', () => {
    it('should format unit selection', () => {
      const context = createMockContext();
      const units: CompactUnit[] = [
        {
          id: 'u1',
          name: 'ユニット1',
          catalogId: 'CAT1',
          bp: 5000,
          baseBp: 5000,
          cost: 3,
          active: true,
          abilities: ['不屈'],
          canBoot: false,
        },
      ];
      const prompt = buildUnitChoicePrompt(context, units, '対象を選択', true);

      expect(prompt).toContain('ユニット選択: 対象を選択');
      expect(prompt).toContain('[u1] ユニット1');
      expect(prompt).toContain('BP:5000');
      expect(prompt).toContain('[不屈]');
      expect(prompt).toContain('キャンセル');
    });
  });

  describe('buildBlockChoicePrompt', () => {
    it('should format block selection with attacker info', () => {
      const context = createMockContext();
      const blockers: CompactUnit[] = [
        {
          id: 'u1',
          name: 'ブロッカー',
          catalogId: 'CAT1',
          bp: 6000,
          baseBp: 6000,
          cost: 4,
          active: true,
          abilities: [],
          canBoot: false,
        },
      ];
      const prompt = buildBlockChoicePrompt(context, blockers, { name: 'アタッカー', bp: 5000 });

      expect(prompt).toContain('ブロッカー選択');
      expect(prompt).toContain('アタッカー: アタッカー (BP: 5000)');
      expect(prompt).toContain('[u1] ブロッカー');
    });
  });

  describe('buildInterceptChoicePrompt', () => {
    it('should format intercept selection', () => {
      const context = createMockContext();
      const intercepts: CompactCard[] = [
        {
          id: 'i1',
          name: 'インターセプト1',
          catalogId: 'CAT1',
          cost: 1,
          type: 'intercept',
          playable: true,
        },
      ];
      const prompt = buildInterceptChoicePrompt(context, intercepts);

      expect(prompt).toContain('インターセプト選択');
      expect(prompt).toContain('[i1] インターセプト1');
      expect(prompt).toContain('温存');
    });
  });

  it('should have response format', () => {
    expect(CHOICE_SYSTEM_PROMPT).toContain('selectedIds');
    expect(CHOICE_SYSTEM_PROMPT).toContain('reason');
  });
});
