'use client';

import master from '@/submodule/suit/catalog/catalog';
import classNames from 'classnames';
import { defaultUIColors, getColorCode } from '@/helper/color';
import Image from 'next/image';
import { useSystemContext } from '@/hooks/system/hooks';
import type { Dispatch, MouseEventHandler, SetStateAction } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import keywordsData from '@/submodule/suit/catalog/keywords.json';
import { BattleIconDetail } from './BattleIconsView';
import { Tooltip } from 'react-tooltip';
import DOMPurify from 'dompurify';
import type { ICard } from '@/submodule/suit/types';
import { getImageUrl } from '@/helper/image';

interface LevelProps {
  lv: number;
  bp?: number;
  active?: boolean;
}
export const Level = ({ bp, lv, active }: LevelProps) => {
  return (
    <div
      className={classNames(
        'flex rounded h-6 flex-1 items-center justify-center text-xs font-bold mr-1 px-4',
        {
          'bg-red-700': active,
          'bg-slate-600': !active,
        }
      )}
    >
      <div className="flex-1">Lv.{lv}</div>
      <div className="flex-1 text-right text-xl">{bp}</div>
    </div>
  );
};

interface CardDetailWindowProps {
  x?: number;
  y?: number;
}

export const CardDetailWindow = ({ x = 0, y = 0 }: CardDetailWindowProps) => {
  const { detailCard, setDetailCard, detailPosition } = useSystemContext();
  const [position, setPosition] = useState({ x, y });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x, y });
  const [abilityMode, setAbilityMode] = useState(true);

  const windowRef = useRef<HTMLDivElement>(null);

  // Handle mouse events for dragging
  const handleMouseDown: MouseEventHandler<HTMLDivElement> = e => {
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    },
    [isDragging, dragOffset]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Only set the initial position once when component mounts or when card changes but position hasn't been set yet
  useEffect(() => {
    // Initialize position only if it hasn't been set yet (x and y are both 0)
    if (position.x === 0 && position.y === 0) {
      setPosition(detailPosition);
    }
  }, [detailPosition, position.x, position.y]);

  // Add and remove global event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // If no card is selected, don't render anything
  if (!detailCard) return null;

  return (
    <div
      ref={windowRef}
      className={`fixed transform w-100 ${defaultUIColors.playerInfoBackground} rounded-lg shadow-lg z-50 border ${defaultUIColors.border} overflow-hidden`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <AbilityPane
        handleMouseDown={handleMouseDown}
        catalogId={detailCard.catalogId}
        setDetailCard={setDetailCard}
        abilityMode={abilityMode}
        setAbilityMode={setAbilityMode}
      />
    </div>
  );
};

// 関連アビリティを表示するコンポーネント
const RelatedAbilities = ({ abilityText, isVirus }: { abilityText: string; isVirus: boolean }) => {
  // HTMLタグを削除してプレーンテキストを取得
  const plainText = abilityText.replace(/<[^>]*>/g, '');

  // キーワード一覧から、テキスト内に含まれるキーワードを検索 (matcherフィールドを使用)
  const foundKeywords = keywordsData.filter(keyword => {
    // ウイルスカードの場合は特定のキーワードを除外する可能性も考慮
    if (isVirus && keyword.title === 'virus_specific_keyword') {
      return false;
    }
    return plainText.includes(`${keyword.matcher}`);
  });

  // 見つかったキーワードがない場合は何も表示しない
  if (foundKeywords.length === 0) return null;

  return (
    <div className="my-3">
      <div className="text-sm font-bold mb-1">関連アビリティ</div>
      <div className="flex flex-wrap gap-2">
        {foundKeywords.map((keyword, index) => (
          <div key={index} className="inline-block">
            <Image
              src={
                keyword['no-image']
                  ? '/image/icon/no-image.png'
                  : `/image/icon/${keyword.title}.png`
              }
              alt={''}
              width={24}
              height={24}
              className="inline-block"
              data-tooltip-id={`ability-tooltip-${keyword.title}`}
            />
            <Tooltip id={`ability-tooltip-${keyword.title}`} place="top" className="z-50 max-w-xs">
              <BattleIconDetail name={keyword.title} />
            </Tooltip>
          </div>
        ))}
      </div>
    </div>
  );
};

const AbilityPane = ({
  handleMouseDown,
  catalogId,
  setDetailCard,
  abilityMode,
  setAbilityMode,
}: {
  handleMouseDown: MouseEventHandler<HTMLDivElement>;
  catalogId: string;
  setDetailCard: Dispatch<SetStateAction<ICard | undefined>>;
  abilityMode: boolean;
  setAbilityMode: Dispatch<SetStateAction<boolean>>;
}) => {
  const cardType = {
    unit: 'ユニットカード',
    advanced_unit: '進化カード',
    trigger: 'トリガーカード',
    intercept: 'インターセプトカード',
    virus: 'ウィルスユニット',
    joker: 'ジョーカーカード',
  };

  const catalog = master.get(catalogId);
  return catalog && abilityMode ? (
    <>
      {/* ウィンドウヘッダー */}
      <div
        className={`flex justify-between items-center p-3 h-20 ${defaultUIColors.background} cursor-move`}
        style={{
          backgroundImage: `url${getImageUrl(catalogId)}`,
          backgroundSize: 'cover',
          backgroundPosition: '0% -140px',
        }}
        onMouseDown={handleMouseDown}
        onDoubleClick={() => setAbilityMode(false)}
      >
        <div className="rounded-sm border-3 border-gray">
          <div
            className={`w-6 h-6 flex items-center justify-center font-bold ${getColorCode(catalog.color)}`}
          >
            {catalog.cost}
          </div>
        </div>
        <h3 className="font-bold bg-black/50 px-6 py-2 flex flex-col items-center justify-center">
          <div className="flex items-center justify-center">
            <span className="mr-2">{catalog.name}</span>
            {catalog.type !== 'virus' && catalog.type !== 'joker' && (
              <Image
                src={`https://coj.sega.jp/player/images/common/card/r_${catalog.rarity}.png`}
                alt={catalog.rarity}
                width={32}
                height={32}
              />
            )}
          </div>
          <span className="text-xs mt-1">
            {`${cardType[catalog.type]} - ${catalog.id} ${catalog.species ? '| ' + catalog.species.join(' / ') : ''}`}
          </span>
        </h3>
        <button
          onClick={() => setDetailCard(undefined)}
          className={`${defaultUIColors.text.secondary} hover:${defaultUIColors.text.primary} cursor-pointer`}
        >
          ✕
        </button>
      </div>

      {/* カード情報 */}
      <div className="p-4 h-60">
        {/* 効果 */}
        <div className="mb-3">
          {/* スクロール可能なテキストエリア */}
          <div className="h-42 overflow-y-auto mb-2">
            <p
              className={`text-sm rounded whitespace-pre-wrap select-text`}
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(catalog.ability, { ALLOWED_TAGS: ['span'] }),
              }}
            />
            {/* 関連アビリティ */}
            {catalog.ability && (
              <RelatedAbilities abilityText={catalog.ability} isVirus={catalog.type === 'virus'} />
            )}
          </div>
        </div>

        {/* BP */}
        {catalog.type !== 'joker' && (
          <div className="justify-between">
            <div className="flex flex-row items-center">
              <Level lv={1} bp={catalog.bp && catalog.bp[0]} active={true} />
              <Level lv={2} bp={catalog.bp && catalog.bp[1]} />
              <Level lv={3} bp={catalog.bp && catalog.bp[2]} />
            </div>
          </div>
        )}
      </div>
    </>
  ) : (
    <ImagePane
      handleMouseDown={handleMouseDown}
      catalogId={catalogId}
      setAbilityMode={setAbilityMode}
    />
  );
};

const ImagePane = ({
  handleMouseDown,
  catalogId,
  setAbilityMode,
}: {
  handleMouseDown: MouseEventHandler<HTMLDivElement>;
  catalogId: string;
  setAbilityMode: Dispatch<SetStateAction<boolean>>;
}) => {
  const catalog = master.get(catalogId);

  if (!catalog) return null;

  return (
    <div
      className={`flex justify-between items-center p-3 h-140 ${defaultUIColors.background} cursor-move`}
      style={{
        backgroundImage: `url(${getImageUrl(catalogId)}`,
        backgroundSize: 'cover',
      }}
      onMouseDown={handleMouseDown}
      onClick={() => setAbilityMode(true)}
    />
  );
};
