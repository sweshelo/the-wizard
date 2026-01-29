'use client';

import { useSystemContext } from '@/hooks/system/hooks';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CardView } from './CardView';
import { ChainOverlay } from './ChainOverlay';
import type { ICard } from '@/submodule/suit/types';
import type { GameState } from '@/hooks/game';
import { useGameStore } from '@/hooks/game';
import { LocalStorageHelper } from '@/service/local-storage';
import master from '@/submodule/suit/catalog/catalog';
import { isMitigated } from '@/helper/game';
import { isICardArray } from '@/helper/card';

interface Props {
  card: ICard;
  isHighlighted?: boolean;
  isSmall?: boolean;
  source?: 'hand' | 'joker';
}

const empty: ICard[] = [];

export const HandView = ({ card, isSmall = false, source = 'hand' }: Props) => {
  const [isHighlighted, setHighlighted] = useState(false);

  const cpSelector = useCallback(
    (state: GameState) => state.players?.[LocalStorageHelper.playerId()].cp.current,
    []
  );
  const triggerSelector = useCallback(
    (state: GameState) => state.players?.[LocalStorageHelper.playerId()].trigger,
    []
  );

  const cp = useGameStore(cpSelector) ?? 0;
  const rawTrigger = useGameStore(triggerSelector);
  const trigger = isICardArray(rawTrigger) ? rawTrigger : empty;
  const { operable, activeCard } = useSystemContext();
  const isStrictOverride = useGameStore(state => state.rule.misc.strictOverride);
  const activeCardType: string | undefined = activeCard?.data.current?.type;
  const cardMaster = useMemo(
    () => (activeCardType ? master.get(activeCardType) : undefined),
    [activeCardType]
  );
  const isSameCard = useMemo(
    () =>
      isStrictOverride
        ? cardMaster?.id === master.get(card.catalogId)?.id
        : cardMaster?.name === master.get(card.catalogId)?.name,
    [card.catalogId, cardMaster?.id, cardMaster?.name, isStrictOverride]
  );
  const isJokerCard = source === 'joker' || master.get(card.catalogId)?.type === 'joker';

  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    transform,
  } = useDraggable({
    id: card.id,
    disabled: !operable,
    data: {
      type: card.catalogId,
      source,
    },
  });
  const { isOver, setNodeRef: setDroppableRef } = useDroppable({
    id: card.id,
    disabled: activeCard?.id === card.id || !isSameCard || isJokerCard,
    data: {
      supports: [card.catalogId],
      type: 'card',
    },
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: transform ? 1 : 0,
  };

  const setNodeRef = useCallback(
    (ref: HTMLElement | null) => {
      setDraggableRef(ref);
      setDroppableRef(ref);
    },
    [setDraggableRef, setDroppableRef]
  );

  useEffect(() => {
    setHighlighted(activeCard?.id !== card.id && isSameCard);
  }, [activeCard?.data, activeCard?.id, card.catalogId, card.id, isSameCard, isStrictOverride]);

  const mitigate = useMemo(() => isMitigated(card, trigger), [card, trigger]);

  return (
    <div
      className={`relative ${activeCard?.id === card.id && 'opacity-75'} dnd-draggable`}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      {cp < (card.currentCost ?? master.get(card.catalogId)?.cost ?? 0) - (mitigate ? 1 : 0) && (
        <div className="absolute inset-0 bg-black opacity-30 z-1 pointer-events-none" />
      )}
      <CardView
        card={card}
        isHighlighting={isHighlighted}
        isSelecting={isOver}
        isMitigated={mitigate}
        isSmall={isSmall}
      />
      {card.delta?.some(delta => delta.effect.type === 'banned') && (
        <ChainOverlay isSmall={isSmall} />
      )}
    </div>
  );
};
