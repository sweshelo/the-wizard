'use client';

import { useState, useEffect } from 'react';
import type { DeckData } from '@/service/local-storage';
import { LocalStorageHelper } from '@/service/local-storage';
import { DeckPreview } from '@/feature/DeckBuilder/DeckPreview';
import catalog from '@/submodule/suit/catalog/catalog';

export const DeckSelector = () => {
  const [mainDeck, setMainDeck] = useState<DeckData | null>(null);
  const [allDecks, setAllDecks] = useState<DeckData[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeckListOpen, setIsDeckListOpen] = useState(false);

  useEffect(() => {
    loadDeckData();
  }, []);

  const loadDeckData = () => {
    const currentMainDeck = LocalStorageHelper.getMainDeck();
    const savedDecks = LocalStorageHelper.getAllDecks();
    setMainDeck(currentMainDeck);
    setAllDecks(savedDecks);
  };

  const handleSetMainDeck = (deckId: string) => {
    LocalStorageHelper.setMainDeckId(deckId);
    loadDeckData();
    setIsDeckListOpen(false);
  };

  const handlePreview = () => {
    if (mainDeck && mainDeck.cards.length > 0) {
      setIsPreviewOpen(true);
    }
  };

  const convertToPreviewCards = (cards: string[]) => {
    return cards.map((catalogId, index) => ({
      catalogId,
      instanceId: `${catalogId}-${index}`,
    }));
  };

  const convertToPreviewJokers = (jokers: string[]) => {
    return jokers.map((id, index) => ({
      id,
      instanceId: `${id}-${index}`,
    }));
  };

  const checkDeckRegulation = (cards: string[]) => {
    // カード情報を取得
    const cardInfos = cards
      .map(catalogId => {
        const cardData = catalog.get(catalogId);
        if (!cardData) {
          console.warn(`カタログに存在しないカードID: ${catalogId}`);
          return null;
        }
        return cardData;
      })
      .filter(Boolean); // nullを除外

    // 1. バージョン0チェック
    const hasVersionZero = cardInfos.some(card => card?.info.version === 0);
    if (hasVersionZero) {
      return { text: '使用不可', color: 'text-gray-400' };
    }

    // 2. 同名カード4枚以上チェック
    const cardNameCounts = new Map<string, number>();
    cardInfos.forEach(card => {
      if (card) {
        const count = cardNameCounts.get(card.name) || 0;
        cardNameCounts.set(card.name, count + 1);
      }
    });

    const hasTooManyDuplicates = Array.from(cardNameCounts.values()).some(count => count >= 4);
    if (hasTooManyDuplicates) {
      return { text: 'レギュレーション違反', color: 'text-red-400' };
    }

    // 3. バージョン1-5チェック
    const hasLimitedVersions = cardInfos.some(card => {
      if (!card) return false;
      const version = card.info.version;
      return version >= 1 && version <= 5;
    });
    if (hasLimitedVersions) {
      return { text: 'レギュレーション制限', color: 'text-yellow-400' };
    }

    // 4. 制限なし
    return { text: '使用可能', color: 'text-green-400' };
  };

  const getDeckStatus = () => {
    if (!mainDeck) {
      return { text: 'デッキが設定されていません', color: 'text-red-400' };
    }
    if (mainDeck.cards.length !== 40) {
      return {
        text: `デッキ枚数が不正です (${mainDeck.cards.length}/40枚)`,
        color: 'text-yellow-400',
      };
    }

    // レギュレーションチェックを実行
    return checkDeckRegulation(mainDeck.cards);
  };

  const status = getDeckStatus();

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-lg font-semibold text-white mb-3">デッキ設定</h3>

      {/* Current Deck Info */}
      <div className="mb-4 p-3 bg-gray-700 rounded-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-medium">{mainDeck ? mainDeck.title : '未設定'}</span>
          <span className={`text-sm ${status.color}`}>{status.text}</span>
        </div>

        {mainDeck && <div className="text-gray-400 text-sm">{mainDeck.cards.length}枚のカード</div>}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3 mb-4">
        <button
          onClick={handlePreview}
          disabled={!mainDeck || mainDeck.cards.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          プレビュー
        </button>

        <button
          onClick={() => setIsDeckListOpen(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          デッキ選択
        </button>
      </div>

      {/* No deck warning */}
      {!mainDeck && (
        <div className="p-3 bg-red-900 border border-red-600 rounded-md">
          <p className="text-red-200 text-sm">
            ゲームを開始するには、メインデッキを設定してください。
            デッキビルダーでデッキを作成し、メインデッキに設定するか、
            既存のデッキから選択してください。
          </p>
        </div>
      )}

      {/* Deck List Modal */}
      {isDeckListOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4 max-h-96 overflow-y-auto">
            <h4 className="text-lg font-semibold text-white mb-4">デッキを選択</h4>

            {allDecks.length === 0 ? (
              <p className="text-gray-400 text-center py-4">保存されたデッキがありません</p>
            ) : (
              <div className="space-y-2">
                {allDecks.map(deck => (
                  <div
                    key={deck.id}
                    className={`p-3 rounded-md border cursor-pointer transition-colors ${
                      mainDeck?.id === deck.id
                        ? 'bg-blue-700 border-blue-500'
                        : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                    }`}
                    onClick={() => handleSetMainDeck(deck.id)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-white font-medium">{deck.title}</span>
                      <span className="text-gray-400 text-sm">{deck.cards.length}枚</span>
                    </div>
                    {mainDeck?.id === deck.id && (
                      <span className="text-blue-300 text-xs">現在のメインデッキ</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setIsDeckListOpen(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deck Preview Modal */}
      {isPreviewOpen && mainDeck && (
        <DeckPreview
          deck={{
            cards: convertToPreviewCards(mainDeck.cards),
            joker: mainDeck.jokers ? convertToPreviewJokers(mainDeck.jokers) : undefined,
          }}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </div>
  );
};
