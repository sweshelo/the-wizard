import { DeckBuilder } from '@/feature/DeckBuilder';
import { defaultUIColors } from '@/helper/color';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Deck Builder',
};

async function getImplementedCardIds(): Promise<string[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SECURE_CONNECTION === 'true' ? 'https://' : 'http://'}${process.env.NEXT_PUBLIC_SERVER_HOST}/api/cards`
    );
    if (!res.ok) return [];
    const data: unknown = await res.json();
    if (Array.isArray(data) && data.every((item): item is string => typeof item === 'string')) {
      return data;
    }
    return [];
  } catch {
    return [];
  }
}

function DeckBuilderWrapper({ implementedIds }: { implementedIds: string[] }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DeckBuilder implementedIds={implementedIds} />
    </Suspense>
  );
}

export default async function Page() {
  const implementedIds: string[] = await getImplementedCardIds();
  return (
    <div className={`min-h-screen select-none ${defaultUIColors.background}`}>
      <DeckBuilderWrapper implementedIds={implementedIds} />
    </div>
  );
}
