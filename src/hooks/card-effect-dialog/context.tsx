'use client';

import type { ReactNode } from 'react';
import { createContext, useReducer, useMemo } from 'react';

// Define the state interface for the card effect dialog
export interface CardEffectDialogState {
  isVisible: boolean;
  title: string;
  message: string;
}

// Define the action types for the reducer
export type CardEffectDialogAction =
  | { type: 'SHOW_DIALOG'; title: string; message: string }
  | { type: 'HIDE_DIALOG' };

// Define the context type
export type CardEffectDialogContextType = {
  state: CardEffectDialogState;
  showDialog: (title: string, message: string) => Promise<void>;
  hideDialog: () => void;
};

// Create the context
export const CardEffectDialogContext = createContext<CardEffectDialogContextType | undefined>(
  undefined
);

// Initial state
const initialState: CardEffectDialogState = {
  isVisible: false,
  title: '',
  message: '',
};

// Reducer function
function cardEffectDialogReducer(
  state: CardEffectDialogState,
  action: CardEffectDialogAction
): CardEffectDialogState {
  switch (action.type) {
    case 'SHOW_DIALOG':
      return {
        ...state,
        isVisible: true,
        title: action.title,
        message: action.message,
      };
    case 'HIDE_DIALOG':
      return {
        ...state,
        isVisible: false,
      };
    default:
      return state;
  }
}

// Provider component
export const CardEffectDialogProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cardEffectDialogReducer, initialState);

  // Action creators
  const showDialog = (title: string, message: string): Promise<void> => {
    dispatch({ type: 'SHOW_DIALOG', title, message });

    return new Promise(resolve => {
      setTimeout(() => {
        dispatch({ type: 'HIDE_DIALOG' });
        resolve();
      }, 2500);
    });
  };

  const hideDialog = () => {
    dispatch({ type: 'HIDE_DIALOG' });
  };

  // Memoized context value
  const contextValue = useMemo(() => ({ state, showDialog, hideDialog }), [state]);

  return (
    <CardEffectDialogContext.Provider value={contextValue}>
      {children}
    </CardEffectDialogContext.Provider>
  );
};
