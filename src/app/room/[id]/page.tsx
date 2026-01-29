import { Game } from '@/feature/Game';
import { GameContextProvider } from '@/hooks/game/GameContextProvider';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Game',
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <GameContextProvider>
      <Game id={id} />
    </GameContextProvider>
  );
}
