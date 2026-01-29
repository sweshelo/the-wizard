'use client';

import type { IUnit } from '@/submodule/suit/types';
import type { Dispatch, SetStateAction } from 'react';
import { createContext, useCallback, useState } from 'react';

export type SelectionMode = 'select' | 'target' | 'block';

export interface UnitSelectionContextType {
  candidate: IUnit[] | undefined;
  setCandidate: (unit: IUnit[] | undefined) => void;
  selectionMode: SelectionMode;
  setSelectionMode: (mode: SelectionMode) => void;
  handleSelected: ((unit?: IUnit['id']) => void) | undefined;
  setHandleSelected: (callback: ((unit?: IUnit['id']) => void) | undefined) => void;
  setAvailableUnits: (
    units: IUnit[],
    onSelected: (unitId?: IUnit['id']) => void,
    mode: SelectionMode,
    title?: string,
    isCancelable?: boolean
  ) => void;
  activeUnit: IUnit | undefined;
  setActiveUnit: Dispatch<SetStateAction<IUnit | undefined>>;

  // 選択画面タイトル
  title?: string;
  setTitle: (title?: string) => void;

  // キャンセル可否
  isCancelable: boolean;
  setIsCancelable: (isCancelable: boolean) => void;

  // 効果発動アニメーション
  animationUnit: IUnit['id'] | undefined;
  setAnimationUnit: Dispatch<SetStateAction<IUnit['id'] | undefined>>;
}

export const UnitSelectionContext = createContext<UnitSelectionContextType | undefined>(undefined);

export interface UnitSelectionProviderProps {
  children: React.ReactNode;
}

export const UnitSelectionProvider = ({ children }: UnitSelectionProviderProps) => {
  // State
  const [candidate, setCandidate] = useState<IUnit[]>();
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('target');
  const [handleSelected, setHandleSelected] = useState<((unit?: IUnit['id']) => void) | undefined>(
    undefined
  );
  const [activeUnit, setActiveUnit] = useState<IUnit | undefined>(undefined);
  const [animationUnit, setAnimationUnit] = useState<IUnit['id']>();

  // 追加: タイトルとキャンセル可否
  const [title, setTitle] = useState<string | undefined>(undefined);
  const [isCancelable, setIsCancelable] = useState<boolean>(true);

  const setAvailableUnits = useCallback(
    (
      units: IUnit[],
      onSelected: (unit?: IUnit['id']) => void,
      mode: SelectionMode = 'target',
      title?: string,
      isCancelable?: boolean
    ) => {
      setCandidate(units);
      setSelectionMode(mode);
      setHandleSelected(() => onSelected);
      setTitle(title);
      setIsCancelable(isCancelable !== undefined ? isCancelable : true);
    },
    []
  );

  return (
    <UnitSelectionContext.Provider
      value={{
        candidate,
        selectionMode,
        setSelectionMode,
        setCandidate,
        handleSelected,
        setHandleSelected,
        setAvailableUnits,
        activeUnit,
        setActiveUnit,
        animationUnit,
        setAnimationUnit,
        title,
        setTitle,
        isCancelable,
        setIsCancelable,
      }}
    >
      {children}
    </UnitSelectionContext.Provider>
  );
};
