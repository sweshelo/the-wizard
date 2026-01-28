'use client';

import { useContext } from 'react';
import { DeckContext, type DeckContextType } from './context';

/**
 * デッキコンテキストを使用するためのフック
 */
export function useDeck(): DeckContextType {
  const context = useContext(DeckContext);

  if (context === undefined) {
    throw new Error('useDeck must be used within a DeckProvider');
  }

  return context;
}
