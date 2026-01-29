'use client';

import type { ICard } from '@/submodule/suit/types';
import type { ReactNode } from 'react';
import { createContext, useState } from 'react';

export type CardsDialogContextType = {
  cards: ICard[] | undefined;
  setCards: React.Dispatch<React.SetStateAction<ICard[] | undefined>>;
  dialogTitle: string;
  setDialogTitle: React.Dispatch<React.SetStateAction<string>>;
  isOpen: boolean;
  isSelector: boolean;
  setIsSelector: React.Dispatch<React.SetStateAction<boolean>>;
  count: number;
  setCount: React.Dispatch<React.SetStateAction<number>>;
  selection: string[];
  setSelection: React.Dispatch<React.SetStateAction<string[]>>;
  resolvePromise: ((value: string[]) => void) | null;
  setResolvePromise: React.Dispatch<React.SetStateAction<((value: string[]) => void) | null>>;
  timeLimit: number | null;
  setTimeLimit: React.Dispatch<React.SetStateAction<number | null>>;
  cleanupFunction: (() => void) | null;
  setCleanupFunction: React.Dispatch<React.SetStateAction<(() => void) | null>>;
};

export const CardsDialogContext = createContext<CardsDialogContextType | undefined>(undefined);

export const CardsDialogProvider = ({ children }: { children: ReactNode }) => {
  const [cards, setCards] = useState<ICard[] | undefined>(undefined);
  const [dialogTitle, setDialogTitle] = useState<string>('');
  const [isSelector, setIsSelector] = useState<boolean>(true);
  const [count, setCount] = useState(1);
  const [selection, setSelection] = useState<string[]>([]);
  const [resolvePromise, setResolvePromise] = useState<((value: string[]) => void) | null>(null);
  const [timeLimit, setTimeLimit] = useState<number | null>(null);
  const [cleanupFunction, setCleanupFunction] = useState<(() => void) | null>(null);

  // Dialog is open when there are cards to display
  const isOpen = cards !== undefined;

  return (
    <CardsDialogContext.Provider
      value={{
        cards,
        setCards,
        dialogTitle,
        setDialogTitle,
        isOpen,
        isSelector,
        setIsSelector,
        count,
        setCount,
        selection,
        setSelection,
        resolvePromise,
        setResolvePromise,
        timeLimit,
        setTimeLimit,
        cleanupFunction,
        setCleanupFunction,
      }}
    >
      {children}
    </CardsDialogContext.Provider>
  );
};
