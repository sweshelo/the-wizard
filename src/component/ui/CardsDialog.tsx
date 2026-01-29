import type { ICard } from '@/submodule/suit/types';
import { CardView } from './CardView';

interface CardsDialogViewProps {
  cards: ICard[];
  isAnimating?: boolean;
  handleCardClick?: (card: ICard) => void;
  selection?: ICard['id'][];
  width?: number;
  height?: number;
}

export const CardsDialogView = ({
  cards,
  isAnimating,
  handleCardClick,
  selection,
  width = 1192,
  height = 520,
}: CardsDialogViewProps) => {
  return (
    <div
      className="bg-slate-800/35 w-full p-4 overflow-auto border-y-3 border-white p-3 box-border"
      style={{
        height: `${height}px`,
        opacity: isAnimating ? 1 : 0,
        transition: 'opacity 100ms ease-in-out',
      }}
    >
      {/* Center container */}
      <div className="flex justify-center">
        {/* デフォルト値の 1192 は 10*112+8*9 */}
        <div className={`flex flex-wrap justify-start gap-2`} style={{ width }}>
          {cards?.map(card => (
            <CardView
              card={card}
              key={card.id}
              onClick={() => handleCardClick?.(card)}
              isHighlighting={selection?.includes(card.id)}
              isSelecting={selection?.includes(card.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
