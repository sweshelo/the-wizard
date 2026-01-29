'use client';

import type { ICard } from '@/submodule/suit/types';
import { useContext, useCallback } from 'react';
import type { InterceptUsageContextType } from './context';
import { InterceptUsageContext } from './context';

// Main hook to access the intercept usage context
export const useInterceptUsage = (): InterceptUsageContextType => {
  const context = useContext(InterceptUsageContext);

  if (!context) {
    throw new Error('useInterceptUsage must be used within an InterceptUsageProvider');
  }

  return context;
};

// Utility hook to check if a card is in the available intercepts list
export const useIsInterceptAvailable = () => {
  const { availableIntercepts } = useInterceptUsage();

  return useCallback(
    (card: ICard) => {
      return availableIntercepts.some(intercept => intercept.id === card.id);
    },
    [availableIntercepts]
  );
};

// Utility hook to check if there are any available intercepts
export const useHasAvailableIntercepts = () => {
  const { availableIntercepts } = useInterceptUsage();

  return availableIntercepts.length > 0;
};
