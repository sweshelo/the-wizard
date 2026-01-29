'use client';

import type { ReactNode } from 'react';
import React, { createContext, useState, useContext, useCallback } from 'react';

export interface OverclockEffectContextType {
  activeUnits: string[]; // 複数ユニットが同時にオーバークロック可能
  addOverclockUnit: (unitId: string) => void;
  removeOverclockUnit: (unitId: string) => void;
}

const OverclockEffectContext = createContext<OverclockEffectContextType | undefined>(undefined);

export const OverclockEffectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeUnits, setActiveUnits] = useState<string[]>([]);

  const addOverclockUnit = useCallback((unitId: string) => {
    setActiveUnits(prev => {
      if (prev.includes(unitId)) return prev;
      return [...prev, unitId];
    });
  }, []);

  const removeOverclockUnit = useCallback((unitId: string) => {
    setActiveUnits(prev => prev.filter(id => id !== unitId));
  }, []);

  return (
    <OverclockEffectContext.Provider value={{ activeUnits, addOverclockUnit, removeOverclockUnit }}>
      {children}
    </OverclockEffectContext.Provider>
  );
};

export const useOverclockEffect = () => {
  const context = useContext(OverclockEffectContext);
  if (context === undefined) {
    throw new Error('useOverclockEffect must be used within a OverclockEffectProvider');
  }
  return context;
};
