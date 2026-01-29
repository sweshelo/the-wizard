import type { Metadata } from 'next';
import { LinkCard } from '@/component/ui/LinkCard';

export const metadata: Metadata = {
  title: 'TOP',
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 flex flex-col items-center">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Re:volutions</h1>
        <p className="text-gray-600">ありえねぇカードゲームシミュレーター</p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-2xl">
        <LinkCard
          href="/entrance"
          title="ロビー"
          description="ゲームロビーに入室してマッチングを開始"
          icon="🎮"
        />
        <LinkCard
          href="/builder"
          title="デッキ編集"
          description="自分だけのデッキを作成・編集"
          icon="🃏"
        />
        <LinkCard
          href="https://github.com/sweshelo/the-fool"
          title="ソースコード"
          description="GitHubでプロジェクトを確認"
          icon="💻"
        />
        <LinkCard
          href="https://x.com/sweshelo"
          title="X"
          description="バグ報告・カード実装依頼などはこちら"
          icon="🔗"
        />
        <LinkCard
          href="https://discord.gg/Q7Sx77YzEJ"
          title="Discord"
          description="バグ報告・カード実装依頼などはこちら"
          icon="💬"
        />
      </div>
    </div>
  );
}
