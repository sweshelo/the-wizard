'use client';

import { useContext } from 'react';
import { AuthContext, type AuthContextType } from './context';

/**
 * 認証コンテキストを使用するためのフック
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
