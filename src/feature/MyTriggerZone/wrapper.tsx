import { useRule, useTrigger } from '@/hooks/game/hooks';
import { useSystemContext } from '@/hooks/system/hooks';
import { LocalStorageHelper } from '@/service/local-storage';
import { useDroppable } from '@dnd-kit/core';
import type { ReactNode } from 'react';
import master from '@/submodule/suit/catalog/catalog';

interface MyTriggerZoneWrapperProps {
  children: ReactNode;
}

export const MyTriggerZoneWrapper = ({ children }: MyTriggerZoneWrapperProps) => {
  const { activeCard } = useSystemContext();
  const playerId = LocalStorageHelper.playerId();
  const rule = useRule();
  const trigger = useTrigger(playerId) ?? [];
  const isJokerBySource = activeCard?.data.current?.source === 'joker';
  const activeCardType: string | undefined = activeCard?.data.current?.type;
  const isJokerByType = activeCardType ? master.get(activeCardType)?.type === 'joker' : false;
  const isJokerCard = isJokerBySource || isJokerByType;
  const { isOver, setNodeRef } = useDroppable({
    id: 'trigger-zone',
    data: {
      type: 'trigger-zone',
      accepts: ['card'],
    },
    disabled: trigger.length >= rule.player.max.trigger || isJokerCard,
  });

  return (
    <div ref={setNodeRef} className="relative dnd-droppable">
      {/* Field content */}
      {children}

      {/* Field highlight animation when card is dragged over */}
      {activeCard && isOver && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div
            className="absolute border-2 rounded-lg w-4/5 h-4/5 animate-field-highlight"
            style={{ borderColor: 'rgba(255, 255, 255, 0.6)' }}
          />
        </div>
      )}
    </div>
  );
};
