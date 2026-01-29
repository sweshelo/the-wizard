'use client';

import type { ICard } from '@/submodule/suit/types';
import type { Active } from '@dnd-kit/core/dist/store';

import type { ReactNode } from 'react';
import { createContext, useState } from 'react';

export type SystemContextType = {
  selectedCard: ICard | undefined;
  setSelectedCard: React.Dispatch<React.SetStateAction<ICard | undefined>>;
  activeCard: Active | undefined;
  setActiveCard: React.Dispatch<React.SetStateAction<Active | undefined>>;
  operable: boolean;
  setOperable: React.Dispatch<React.SetStateAction<boolean>>;
  // Cursor collision detection configuration
  cursorCollisionSize: number;
  setCursorCollisionSize: React.Dispatch<React.SetStateAction<number>>;
  // Removed openDeck, setOpenDeck, openTrash, setOpenTrash
  // These are now handled by the CardsDialog context

  // Card detail window
  detailCard: ICard | undefined;
  setDetailCard: React.Dispatch<React.SetStateAction<ICard | undefined>>;
  detailPosition: { x: number; y: number };
  setDetailPosition: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
};

export const SystemContext = createContext<SystemContextType | undefined>(undefined);

export const SystemContextProvider = ({ children }: { children: ReactNode }) => {
  // 詳細用
  const [selectedCard, setSelectedCard] = useState<ICard | undefined>(undefined);
  // ドラッグ中のカード
  const [activeCard, setActiveCard] = useState<Active | undefined>(undefined);
  const [operable, setOperable] = useState(false);
  // カーソル周辺のヒットエリアサイズ（ピクセル）
  const [cursorCollisionSize, setCursorCollisionSize] = useState(15);

  // カード詳細ウィンドウ用の状態
  const [detailCard, setDetailCard] = useState<ICard | undefined>(undefined);
  const [detailPosition, setDetailPosition] = useState<{ x: number; y: number }>({
    x: 100,
    y: 100,
  });

  return (
    <SystemContext.Provider
      value={{
        selectedCard,
        setSelectedCard,
        operable,
        setOperable,
        activeCard,
        setActiveCard,
        cursorCollisionSize,
        setCursorCollisionSize,
        detailCard,
        setDetailCard,
        detailPosition,
        setDetailPosition,
      }}
    >
      {children}
    </SystemContext.Provider>
  );
};
