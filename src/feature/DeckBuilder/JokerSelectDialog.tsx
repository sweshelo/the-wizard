'use client';

import { useState, useMemo } from 'react';
import master from '@/submodule/suit/catalog/catalog';
import type { ICard } from '@/submodule/suit/types';
import { CardView } from '@/component/ui/CardView';

interface JokerSelectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (catalogId: string) => void;
  selectedJokers: string[];
}

export const JokerSelectDialog = ({
  isOpen,
  onClose,
  onSelect,
  selectedJokers,
}: JokerSelectDialogProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  // JOKERカードのみをフィルタリング
  const jokerCatalogs = useMemo(() => {
    return Array.from(master.values())
      .filter(catalog => catalog.type === 'joker')
      .filter(catalog => {
        if (searchQuery === '') return true;
        return (
          catalog.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          catalog.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          catalog.ability.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
      <div className="bg-gray-800 p-6 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">JOKER選択</h2>
          <button className="text-gray-400 hover:text-white text-2xl" onClick={onClose}>
            ×
          </button>
        </div>

        {/* 検索ボックス */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="カード名や効果テキストで検索"
            className="border-2 border-gray-600 bg-gray-700 text-white rounded p-2 w-full"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* JOKERカード一覧 */}
        <div className="overflow-y-auto flex-1 bg-gray-900 rounded p-4">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-4">
            {jokerCatalogs.map(catalog => {
              const card: ICard = {
                id: catalog.id,
                catalogId: catalog.id,
                lv: 1,
              };

              const isSelected = selectedJokers.includes(catalog.id);

              return (
                <div key={catalog.id} className={`relative w-19 ${isSelected ? 'opacity-50' : ''}`}>
                  <CardView
                    card={card}
                    onClick={() => {
                      if (!isSelected) {
                        onSelect(catalog.id);
                      }
                    }}
                    isSmall
                  />
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded pointer-events-none w-19">
                      <span className="text-white font-bold text-xs">選択済み</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
            onClick={onClose}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
