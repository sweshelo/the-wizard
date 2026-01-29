import { useWebSocketGame } from '@/hooks/game';
import { useSystemContext } from '@/hooks/system/hooks';
import { useHand, useField } from '@/hooks/game/hooks';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { useDndMonitor } from '@dnd-kit/core';
import { LocalStorageHelper } from '@/service/local-storage';
import catalog from '@/submodule/suit/catalog/catalog';
import { isICard } from '@/helper/card';

export const useMyArea = () => {
  const { activeCard, setActiveCard } = useSystemContext();
  const { override, unitDrive, jokerDrive, setTrigger, discard, evolution } = useWebSocketGame();

  // Get current player ID
  const currentPlayerId = LocalStorageHelper.playerId();

  // Get player's hand and field for evolution handling
  const rawHand = useHand(currentPlayerId) || [];
  const hand = rawHand.filter(isICard);
  const field = useField(currentPlayerId) || [];
  useDndMonitor({
    onDragStart(e: DragStartEvent) {
      setActiveCard(e.active);
    },
    onDragEnd(e: DragEndEvent) {
      const { over } = e;
      const cardSource: string | undefined = e.active.data.current?.source;
      const activeCardType: string | undefined = e.active.data.current?.type;
      switch (over?.data.current?.type) {
        case 'field':
          {
            const isJokerBySource = cardSource === 'joker';
            const isJokerByType = activeCardType
              ? catalog.get(activeCardType)?.type === 'joker'
              : false;
            if (activeCard?.id) {
              const targetId = String(activeCard.id);
              if (isJokerBySource || isJokerByType) {
                jokerDrive({ target: targetId });
              } else {
                unitDrive({ target: targetId });
              }
            }
          }
          break;
        case 'card':
          if (activeCard?.id && typeof over.id === 'string') {
            override({
              target: String(activeCard.id),
              parent: over.id,
            });
          }
          break;
        case 'trigger-zone':
          if (activeCard?.id) {
            setTrigger({ target: { id: String(activeCard.id), catalogId: '', lv: 1 } });
          }
          break;
        case 'trash':
          if (activeCard?.id) {
            discard({ target: { id: String(activeCard.id), catalogId: '', lv: 1 } });
          }
          break;
        case 'unit':
          {
            // Evolution handling
            const draggedCardId = activeCard?.id ? String(activeCard.id) : undefined;
            const targetUnitId: string | undefined = over.data.current?.unitId;

            if (!draggedCardId || !targetUnitId) break;

            // Find the corresponding card and unit
            const handCard = hand.find(card => card.id === draggedCardId);
            const fieldUnit = field.find(unit => unit.id === targetUnitId);

            if (handCard && fieldUnit) {
              // Get catalog entries
              const handCardMaster = catalog.get(handCard.catalogId);

              // Check if it's an advanced_unit (already checked in UnitView's droppable config,
              // but double-checking here for safety)
              if (handCardMaster?.type === 'advanced_unit') {
                // Send evolution action to server
                evolution({
                  source: fieldUnit,
                  target: handCard,
                });
              }
            }
          }
          break;
        default:
          break;
      }
      setActiveCard(undefined);
    },
  });
};
