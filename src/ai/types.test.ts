// src/ai/types.test.ts
import { describe, it, expect } from 'bun:test';
import type { AIGameContext, CompactUnit, CompactCard, PlayerResources } from './types';

describe('AI Types', () => {
  it('should define AIGameContext type', () => {
    const context: AIGameContext = {
      turn: 1,
      round: 1,
      isMyTurn: true,
      self: {
        life: 7,
        cp: { current: 3, max: 3 },
        jokerGauge: 0,
        handCount: 5,
        deckCount: 35,
      },
      opponent: {
        life: 7,
        cp: { current: 3, max: 3 },
        jokerGauge: 0,
        handCount: 5,
        deckCount: 35,
      },
      myField: [],
      opponentField: [],
      myHand: [],
      myTrigger: [],
      recentEvents: [],
    };
    expect(context.turn).toBe(1);
    expect(context.isMyTurn).toBe(true);
  });

  it('should define CompactUnit type', () => {
    const unit: CompactUnit = {
      id: 'u1',
      name: 'テストユニット',
      catalogId: 'test-001',
      bp: 5000,
      baseBp: 5000,
      cost: 3,
      active: true,
      abilities: ['貫通'],
      canBoot: false,
    };
    expect(unit.id).toBe('u1');
    expect(unit.bp).toBe(5000);
    expect(unit.abilities).toContain('貫通');
  });

  it('should define CompactCard type', () => {
    const card: CompactCard = {
      id: 'c1',
      name: 'テストカード',
      catalogId: 'test-002',
      cost: 2,
      type: 'unit',
      playable: true,
    };
    expect(card.id).toBe('c1');
    expect(card.type).toBe('unit');
    expect(card.playable).toBe(true);
  });

  it('should define PlayerResources type', () => {
    const resources: PlayerResources = {
      life: 5,
      cp: { current: 6, max: 8 },
      jokerGauge: 50,
      handCount: 3,
      deckCount: 20,
    };
    expect(resources.life).toBe(5);
    expect(resources.cp.current).toBe(6);
    expect(resources.jokerGauge).toBe(50);
  });

  it('should support all card types including joker', () => {
    const types: CompactCard['type'][] = [
      'unit',
      'trigger',
      'intercept',
      'advanced_unit',
      'virus',
      'joker',
    ];
    types.forEach(type => {
      const card: CompactCard = {
        id: 'c1',
        name: 'Test',
        catalogId: 'test',
        cost: 1,
        type,
        playable: false,
      };
      expect(card.type).toBe(type);
    });
  });
});
