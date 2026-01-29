import master from '@/submodule/suit/catalog/catalog';
import type { IAtom, ICard } from '@/submodule/suit/types';

type ColorKey = 1 | 2 | 3 | 4 | 5;

const colors: Record<ColorKey, string> = {
  1: 'red',
  2: 'yellow',
  3: 'blue',
  4: 'green',
  5: 'purple',
};

function isColorKey(value: number | undefined): value is ColorKey {
  return value !== undefined && value >= 1 && value <= 5;
}

export const BackFlipedCard = ({ card }: { card: ICard | (IAtom & { color: string }) }) => {
  const isAtom = 'color' in card;
  const catalogColor = !isAtom ? master.get(card.catalogId)?.color : undefined;
  const color = isAtom ? card.color : isColorKey(catalogColor) ? colors[catalogColor] : 'gray';

  return (
    <div
      className="w-19 h-26 border-1 border-white rounded-sm bg-gray-800"
      style={{
        backgroundImage: `url('/image/card/back/${color}.png')`,
        backgroundSize: 'cover',
      }}
    />
  );
};
