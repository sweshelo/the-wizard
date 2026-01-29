import { BackFlipedCard } from '@/component/ui/BackFlipedCard';
import { CardView } from '@/component/ui/CardView';
import { ChainOverlay } from '@/component/ui/ChainOverlay';
import { RotatedSquareHighlight } from '@/component/ui/RotatedSquareHighlight';
import { useTrigger, useRule } from '@/hooks/game/hooks';
import { useInterceptUsage } from '@/hooks/intercept-usage';
import { LocalStorageHelper } from '@/service/local-storage';
import master from '@/submodule/suit/catalog/catalog';
import type { ICard } from '@/submodule/suit/types';

function isICardArray(value: unknown): value is ICard[] {
  return Array.isArray(value) && value.every(item => 'catalogId' in item && 'lv' in item);
}

export const MyTriggerZoneBody = () => {
  const { availableIntercepts, activateIntercept } = useInterceptUsage();
  const playerId = LocalStorageHelper.playerId();
  const rawTrigger = useTrigger(playerId);
  const trigger = isICardArray(rawTrigger) ? rawTrigger : [];
  const rule = useRule();

  return (
    <div className="flex gap-1">
      {[...Array(rule.player.max.trigger)].map((_, index) => {
        const card = trigger[index];
        const catalog = card ? master.get(card.catalogId) : undefined;
        const isUnit = catalog?.type === 'unit' || catalog?.type === 'advanced_unit';

        // Check if this card is in the available intercepts list
        const isAvailable =
          card && !isUnit && availableIntercepts.some(intercept => intercept.id === card.id);

        return card ? (
          isUnit ? (
            <BackFlipedCard card={card} key={index} />
          ) : (
            <RotatedSquareHighlight
              isVisible={isAvailable}
              key={index}
              onClick={() => card && isAvailable && activateIntercept(card.id)}
            >
              <CardView card={card} isSmall isHighlighting={isAvailable} />
              {card.delta?.some(delta => delta.effect.type === 'banned') && (
                <ChainOverlay isSmall={true} />
              )}
            </RotatedSquareHighlight>
          )
        ) : (
          <div className="w-19 h-26 border-1 border-white rounded-sm bg-gray-800" key={index} />
        );
      })}
    </div>
  );
};
