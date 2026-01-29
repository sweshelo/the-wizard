import { useContext } from 'react';
import type { SystemContextType } from '.';
import { SystemContext } from '.';

export const useSystemContext = (): SystemContextType => {
  const context = useContext(SystemContext);
  if (context === null || context === undefined) {
    throw Error('useSystemContext must be used within a SystemProvider');
  }
  return context;
};
