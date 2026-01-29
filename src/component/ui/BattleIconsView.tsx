'use client';

import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { Tooltip } from 'react-tooltip';
import keywordsData from '../../submodule/suit/catalog/keywords.json';
import type { IDelta } from '@/submodule/suit/types';

interface BattleIconsViewProps {
  delta?: IDelta[];
}

function getKeywordName(effect: IDelta['effect']): string | null {
  if (effect.type === 'keyword' && 'name' in effect) {
    return effect.name;
  }
  return null;
}

const BattleIconsViewComponent = ({ delta }: BattleIconsViewProps) => {
  const deltaArray = Array.isArray(delta) ? delta : [];
  const [currentPage, setCurrentPage] = useState(0);

  const keywordEffects: string[] = Array.from(
    new Set(
      deltaArray
        .map(item => getKeywordName(item.effect))
        .filter((name): name is string => name !== null)
    )
  );
  const totalPages = Math.ceil(keywordEffects.length / 5);

  // Use useEffect to cycle through pages every second if there are more than 5 icons
  useEffect(() => {
    if (totalPages <= 1) return;

    const checkAndUpdatePage = () => {
      // Use Date to synchronize across all components
      const currentSecond = Math.floor(Date.now() / 1000);
      setCurrentPage(currentSecond % totalPages);
    };

    // Set initial page
    checkAndUpdatePage();

    // Check every 1000ms (1 second) to update the page
    const intervalId = setInterval(checkAndUpdatePage, 1000);

    return () => clearInterval(intervalId);
  }, [totalPages]);

  // If no keyword effects, don't render anything
  if (keywordEffects.length === 0) return null;

  // Get current icons to display
  const displayIcons = keywordEffects.slice(currentPage * 5, currentPage * 5 + 5);

  return (
    <div className="absolute flex justify-center w-32 h-6 mb-1 bottom-[48px]">
      <div className="flex flex-row justify-start items-center w-[120px]">
        {displayIcons.map(item => (
          <Image
            key={item}
            src={
              keywordsData.find(k => k.title === item)?.['no-image']
                ? '/image/icon/no-image.png'
                : `/image/icon/${item}.png`
            }
            alt={item}
            width={24}
            height={24}
            className="inline-block z-0"
            data-tooltip-id={`keyword-tooltip-${item}`}
          />
        ))}
      </div>

      {/* Add tooltips for each icon */}
      {displayIcons.map(item => {
        const keyword = keywordsData.find(k => k.title === item);
        return (
          <Tooltip
            key={`tooltip-${item}`}
            id={`keyword-tooltip-${item}`}
            place="top"
            className="z-1 max-w-xs"
          >
            {keyword ? <BattleIconDetail name={keyword.title} /> : item}
          </Tooltip>
        );
      })}
    </div>
  );
};

export const BattleIconDetail = ({ name }: { name: string }) => {
  const keyword = keywordsData.find(k => k.title === name);
  if (keyword === undefined) return null;

  return (
    <div className="p-1">
      <div className="flex items-center mb-1">
        <Image
          src={
            keyword['no-image'] ? '/image/icon/no-image.png' : `/image/icon/${keyword.title}.png`
          }
          alt=""
          width={24}
          height={24}
          className="inline-block mr-2"
        />
        <div className="font-bold text-lg">{keyword.title}</div>
      </div>
      {keyword.text && <div className="italic">&quot;{keyword.text}&quot;</div>}
      <div className="border-t-1 py-1 my-1">{keyword.description}</div>
    </div>
  );
};

export const BattleIconsView = React.memo(BattleIconsViewComponent);
