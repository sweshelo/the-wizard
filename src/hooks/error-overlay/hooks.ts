import { useContext } from 'react';
import type { ErrorOverlayContextType } from './context';
import { ErrorOverlayContext } from './context';

export const useErrorOverlay = (): ErrorOverlayContextType => {
  const context = useContext(ErrorOverlayContext);

  if (context === undefined) {
    throw new Error('useErrorOverlay must be used within an ErrorOverlayProvider');
  }

  return context;
};
