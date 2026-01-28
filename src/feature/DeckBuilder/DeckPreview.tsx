import { ProgressConfirmButton } from '@/component/ui/ProgressConfirmButton';
import { getImageUrl } from '@/helper/image';
import master from '@/submodule/suit/catalog/catalog';
import { ICard } from '@/submodule/suit/types';

interface DeckPreviewProps {
  deck: {
    cards: ICard[];
    joker?: ICard[];
  };
  onClose: () => void;
}

const JOKER_TABLE = [
  { suffix: '1st', color: 'border-cyan-500' },
  { suffix: '2nd', color: 'border-yellow-500' },
];

export const DeckPreview = ({ deck, onClose }: DeckPreviewProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95">
      <div className="flex flex-col items-center">
        <div
          className="bg-slate-800/35 w-full p-4 overflow-auto border-y-3 border-white p-3 box-border"
          style={{
            height: `688px`,
            transition: 'opacity 100ms ease-in-out',
          }}
        >
          {/* Center container */}
          <div className="flex justify-center">
            {/* デフォルト値の 1192 は 10*112+8*9 */}
            <div className={`flex flex-wrap justify-start gap-2`} style={{ width: 1192 }}>
              {deck.cards?.map(card => (
                <div
                  key={card.catalogId}
                  className={`w-28 h-39 border-2 border-slate-600 rounded justify-center items-center text-slate-500 relative dnd-clickable`}
                  style={{
                    backgroundImage: `url(${getImageUrl(card?.catalogId)})`,
                    backgroundSize: 'cover',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        {deck.joker && (
          <div className="flex gap-2 flex-col justify-center my-3">
            <div className="text-center text-lg">JOKER</div>
            <div className="flex gap-10">
              {deck.joker.map((joker, index) => {
                return (
                  <div
                    key={joker.catalogId ?? joker.id}
                    className={`w-90 border ${JOKER_TABLE[index].color} text-bold px-5 py-1`}
                  >
                    {JOKER_TABLE[index].suffix}: {master.get(joker.catalogId ?? joker.id)?.id}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="mt-6 flex justify-center">
          <ProgressConfirmButton buttonText="閉じる" onConfirm={onClose} />
        </div>
      </div>
    </div>
  );
};
