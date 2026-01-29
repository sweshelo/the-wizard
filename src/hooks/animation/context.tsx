'use client';

import type { ReactNode } from 'react';
import React, { createContext, useState, useCallback } from 'react';
import type { AnimationRegistryEntry, EffectType } from './types';

export interface AnimationContextType {
  // アクティブなアニメーションの登録と追跡
  activeAnimations: AnimationRegistryEntry[];
  registerAnimation: (
    type: EffectType,
    target: string,
    metadata?: Record<string, unknown>
  ) => string;
  unregisterAnimation: (id: string) => void;

  // アニメーション間の調整用
  getPriorityAnimation: (target: string) => AnimationRegistryEntry | undefined;
  getAnimationsForTarget: (target: string) => AnimationRegistryEntry[];
}

// デフォルト値
const defaultContext: AnimationContextType = {
  activeAnimations: [],
  registerAnimation: () => '',
  unregisterAnimation: () => {},
  getPriorityAnimation: () => undefined,
  getAnimationsForTarget: () => [],
};

export const AnimationContext = createContext<AnimationContextType>(defaultContext);

export const AnimationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeAnimations, setActiveAnimations] = useState<AnimationRegistryEntry[]>([]);

  // アニメーション登録
  const registerAnimation = useCallback(
    (type: EffectType, target: string, metadata?: Record<string, unknown>): string => {
      const id = `${type}-${target}-${Date.now()}`;

      setActiveAnimations(prev => [...prev, { id, type, target, isActive: true, metadata }]);

      return id;
    },
    []
  );

  // アニメーション登録解除
  const unregisterAnimation = useCallback((id: string) => {
    setActiveAnimations(prev => prev.filter(animation => animation.id !== id));
  }, []);

  // 特定のターゲットに対する優先アニメーションを取得
  const getPriorityAnimation = useCallback(
    (target: string) => {
      return activeAnimations.find(anim => anim.target === target);
    },
    [activeAnimations]
  );

  // 特定のターゲットに関連するすべてのアニメーションを取得
  const getAnimationsForTarget = useCallback(
    (target: string) => {
      return activeAnimations.filter(anim => anim.target === target);
    },
    [activeAnimations]
  );

  return (
    <AnimationContext.Provider
      value={{
        activeAnimations,
        registerAnimation,
        unregisterAnimation,
        getPriorityAnimation,
        getAnimationsForTarget,
      }}
    >
      {children}
    </AnimationContext.Provider>
  );
};
