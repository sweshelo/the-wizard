'use client';

import { useContext } from 'react';
import type { CardUsageEffectContextType } from './context';
import { CardUsageEffectContext } from './context';

// Custom hook to use the card usage effect context
export const useCardUsageEffect = (): CardUsageEffectContextType => {
  const context = useContext(CardUsageEffectContext);

  if (context === undefined) {
    throw new Error('useCardUsageEffect must be used within a CardUsageEffectProvider');
  }

  return context;
};
