import master from '@/submodule/suit/catalog/catalog';
import type { ICard } from '@/submodule/suit/types';

export const isMitigated = (card: ICard, trigger: ICard[]) => {
  const target = master.get(card.catalogId);
  const triggerColor = trigger
    .map(c => {
      const catalog = master.get(c.catalogId);
      return catalog?.type === 'advanced_unit' || catalog?.type === 'unit'
        ? catalog.color
        : undefined;
    })
    .filter(color => typeof color === 'number');

  return (target?.type === 'advanced_unit' || target?.type === 'unit') &&
    target?.color &&
    triggerColor.includes(target?.color)
    ? true
    : false;
};
