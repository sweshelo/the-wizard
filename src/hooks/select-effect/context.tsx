'use client';

import type { ReactNode } from 'react';
import React, { createContext, useState, useContext, useCallback } from 'react';

export interface SelectEffectContextType {
  targetUnitIds: string[]; // 複数ユニットが同時に選択エフェクト可能
  addTargetUnit: (unitId: string) => void;
  removeTargetUnit: (unitId: string) => void;
}

const SelectEffectContext = createContext<SelectEffectContextType | undefined>(undefined);

export const SelectEffectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [targetUnitIds, setTargetUnitIds] = useState<string[]>([]);

  const addTargetUnit = useCallback((unitId: string) => {
    setTargetUnitIds(prev => {
      if (prev.includes(unitId)) return prev;
      return [...prev, unitId];
    });
  }, []);

  const removeTargetUnit = useCallback((unitId: string) => {
    setTargetUnitIds(prev => prev.filter(id => id !== unitId));
  }, []);

  return (
    <SelectEffectContext.Provider value={{ targetUnitIds, addTargetUnit, removeTargetUnit }}>
      {children}
    </SelectEffectContext.Provider>
  );
};

export const useSelectEffect = () => {
  const context = useContext(SelectEffectContext);
  if (context === undefined) {
    throw new Error('useSelectEffect must be used within a SelectEffectProvider');
  }
  return context;
};
