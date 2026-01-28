import { PlayerNameEditor } from './PlayerNameEditor';
import { DeckSelector } from './DeckSelector';
import { AuthStatus } from './AuthStatus';
import { MigrationBanner } from './MigrationBanner';

export const EntranceMenu = () => {
  return (
    <div className="space-y-6 p-6 rounded-lg max-w-lg mx-auto shadow-md">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-black mb-4">ゲーム設定</h2>
      </div>
      <AuthStatus />
      <MigrationBanner />
      <PlayerNameEditor />
      <DeckSelector />
    </div>
  );
};
