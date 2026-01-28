import { nanoid } from 'nanoid';
import type { DeckData } from '@/type/deck';

// Re-export DeckData from centralized type definition
export type { DeckData } from '@/type/deck';

export const LocalStorageHelper = {
  playerName: (): string => {
    // Check if code is running in a browser environment
    if (typeof window === 'undefined') {
      return '';
    }

    const id = window.localStorage.getItem('playerName');
    if (id !== null) {
      return id;
    } else {
      return 'エージェント候補生';
    }
  },

  setPlayerName: (name: string) => {
    window.localStorage.setItem('playerName', name);
  },

  playerId: (): string => {
    // Check if code is running in a browser environment
    if (typeof window === 'undefined') {
      return '';
    }

    const id = window.localStorage.getItem('playerId');
    if (id !== null) {
      return id;
    } else {
      // Generate UUID safely
      const newId = nanoid();
      window.localStorage.setItem('playerId', newId);
      return newId;
    }
  },

  // Get all saved decks
  getAllDecks: (): DeckData[] => {
    if (typeof window === 'undefined') {
      return [];
    }

    const decksStr = window.localStorage.getItem('decks');
    if (decksStr) {
      try {
        return JSON.parse(decksStr);
      } catch (e) {
        console.error('Error parsing decks from localStorage', e);
        return [];
      }
    }
    return [];
  },

  // Save a deck (new or overwrite)
  saveDeck: (
    title: string,
    cards: string[],
    jokers: string[] = [],
    isMainDeck: boolean = false
  ): void => {
    if (typeof window === 'undefined') {
      return;
    }

    const decks = LocalStorageHelper.getAllDecks();
    const existingDeckIndex = decks.findIndex(deck => deck.title === title);
    const id = existingDeckIndex >= 0 ? decks[existingDeckIndex].id : nanoid();

    if (existingDeckIndex >= 0) {
      // Update existing deck
      decks[existingDeckIndex] = { id, title, cards, jokers };
    } else {
      // Add new deck
      decks.push({ id, title, cards, jokers });
    }

    window.localStorage.setItem('decks', JSON.stringify(decks));

    // If this is set as main deck, update the main deck reference
    if (isMainDeck) {
      window.localStorage.setItem('deck', id);
    }
  },

  // Get a deck by title
  getDeckByTitle: (title: string): DeckData | null => {
    if (typeof window === 'undefined') {
      return null;
    }

    const decks = LocalStorageHelper.getAllDecks();
    const deck = decks.find(d => d.title === title);
    return deck || null;
  },

  // Get a deck by ID
  getDeckById: (id: string): DeckData | null => {
    if (typeof window === 'undefined') {
      return null;
    }

    const decks = LocalStorageHelper.getAllDecks();
    const deck = decks.find(d => d.id === id);
    return deck || null;
  },

  // Delete a deck
  deleteDeck: (title: string): void => {
    if (typeof window === 'undefined') {
      return;
    }

    const decks = LocalStorageHelper.getAllDecks();
    const deckToDelete = decks.find(deck => deck.title === title);
    const filteredDecks = decks.filter(deck => deck.title !== title);
    window.localStorage.setItem('decks', JSON.stringify(filteredDecks));

    // If the deleted deck was the main deck, clear the main deck reference
    if (deckToDelete && LocalStorageHelper.getMainDeckId() === deckToDelete.id) {
      window.localStorage.removeItem('deck');
    }
  },

  // Get the main deck ID
  getMainDeckId: (): string | null => {
    if (typeof window === 'undefined') {
      return null;
    }

    return window.localStorage.getItem('deck');
  },

  // Set the main deck ID
  setMainDeckId: (id: string): void => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem('deck', id);
  },

  // Get the main deck
  getMainDeck: (): DeckData | null => {
    if (typeof window === 'undefined') {
      return null;
    }

    const mainDeckId = LocalStorageHelper.getMainDeckId();
    if (!mainDeckId) return null;

    return LocalStorageHelper.getDeckById(mainDeckId);
  },
};
