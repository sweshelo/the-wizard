'use client';

import type { ICard } from '@/submodule/suit/types';
import type { ReactNode } from 'react';
import { createContext, useState, useCallback, useRef } from 'react';
// No longer need to import useWebSocketGame since we don't send messages directly

// Context type definition for intercept usage functionality
export interface InterceptUsageContextType {
  // The list of intercept cards that are available for activation
  availableIntercepts: ICard[];

  // Function to set available intercepts with optional time limit and callbacks
  setAvailableIntercepts: (
    intercepts: ICard[],
    timeLimit?: number,
    onActivate?: (card: ICard) => void,
    onCancel?: () => void
  ) => void;

  // Function to clear the available intercepts
  clearAvailableIntercepts: () => void;

  // Function to activate a specific intercept
  activateIntercept: (interceptId: string) => void;

  // Current time limit for intercept selection (null if no time limit)
  interceptTimeLimit: number | null;

  // Function to cancel intercept selection
  cancelInterceptSelection: () => void;
}

// Create the context with undefined default
export const InterceptUsageContext = createContext<InterceptUsageContextType | undefined>(
  undefined
);

// Provider component that wraps the application or relevant part of it
export const InterceptUsageProvider = ({ children }: { children: ReactNode }) => {
  const [availableIntercepts, setAvailableIntercepts] = useState<ICard[]>([]);
  const [interceptTimeLimit, setInterceptTimeLimit] = useState<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onActivateRef = useRef<((card: ICard) => void) | undefined>(undefined);
  const onCancelRef = useRef<(() => void) | undefined>(undefined);

  // Function to clear available intercepts
  const clearAvailableIntercepts = useCallback(() => {
    setAvailableIntercepts([]);
    setInterceptTimeLimit(null);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Function to set available intercepts with optional time limit and callbacks
  const handleSetAvailableIntercepts = useCallback(
    (
      intercepts: ICard[],
      timeLimit?: number,
      onActivate?: (card: ICard) => void,
      onCancel?: () => void
    ) => {
      // Store callback refs
      onActivateRef.current = onActivate;
      onCancelRef.current = onCancel;
      setAvailableIntercepts(intercepts);

      if (timeLimit) {
        setInterceptTimeLimit(timeLimit);

        // Set timeout to auto-cancel after time limit
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          clearAvailableIntercepts();
          setInterceptTimeLimit(null);
        }, timeLimit * 1000);
      } else {
        setInterceptTimeLimit(null);
      }
    },
    [clearAvailableIntercepts]
  );

  // Function to cancel intercept selection
  const cancelInterceptSelection = useCallback(() => {
    // Call the cancel callback if provided
    if (onCancelRef.current) {
      onCancelRef.current();
    }

    // Clear the available intercepts
    clearAvailableIntercepts();
  }, [clearAvailableIntercepts]);

  // Function to activate a specific intercept and call the provided callback
  const activateIntercept = useCallback(
    (interceptId: string) => {
      // Find the selected card
      const selectedCard = availableIntercepts.find(card => card.id === interceptId);

      // Call the activate callback if provided with the selected card
      if (selectedCard && onActivateRef.current) {
        onActivateRef.current(selectedCard);
      }

      // Clear the available intercepts after activation
      clearAvailableIntercepts();
    },
    [availableIntercepts, clearAvailableIntercepts]
  );

  // The value to be provided by the context
  const contextValue: InterceptUsageContextType = {
    availableIntercepts,
    setAvailableIntercepts: handleSetAvailableIntercepts,
    clearAvailableIntercepts,
    activateIntercept,
    interceptTimeLimit,
    cancelInterceptSelection,
  };

  return (
    <InterceptUsageContext.Provider value={contextValue}>{children}</InterceptUsageContext.Provider>
  );
};
