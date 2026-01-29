import { useContext } from 'react';
import type { SelectionMode } from './context';
import { UnitSelectionContext } from './context';

// Re-export the SelectionMode type for convenience
export type { SelectionMode };

export const useUnitSelection = () => {
  const context = useContext(UnitSelectionContext);

  if (!context) {
    throw new Error('useUnitSelection must be used within a UnitSelectionProvider');
  }

  return context;
};

// Utility function to check if a unit is owned by the current player
export const isOwnUnit = (unitPlayerId: string, currentPlayerId: string): boolean => {
  return unitPlayerId === currentPlayerId;
};
