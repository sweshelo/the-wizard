'use client';

import { SettingsGroup } from '@/component/interface/settingsGroup';
import { Toggle } from '@/component/interface/toggle';
import type { UseFormRegister } from 'react-hook-form';
import type { RoomCreatorFormParams } from '../type';
import { DEFAULT_ROOM_SETTINGS } from '../../../constants/room';

interface DebugSettingsProps {
  register: UseFormRegister<RoomCreatorFormParams>;
}

export const DebugSettings: React.FC<DebugSettingsProps> = ({ register }) => {
  return (
    <SettingsGroup title="デバッグ設定">
      <Toggle
        label="デバッグモード"
        description="デバッグ機能を有効にする"
        registration={register('rule.debug.enable')}
        defaultChecked={DEFAULT_ROOM_SETTINGS.rule.debug.enable}
      />

      <div className="mt-3 mb-1 text-sm font-medium text-gray-700">カード情報の表示</div>

      <div className="pl-3 border-l-2 border-gray-200 mb-3">
        <div className="mb-2 text-sm font-medium text-gray-700">相手の情報</div>
        <div>
          <span className="text-xs text-gray-500 mb-2">
            以下の設定はデバッグモードを有効にしている場合にのみ反映されます。それ以外の場合では通常のルールと同様になります。
          </span>
        </div>
        <div className="pl-3">
          <Toggle
            label="デッキを公開"
            registration={register('rule.debug.reveal.opponent.deck')}
            defaultChecked={DEFAULT_ROOM_SETTINGS.rule.debug.reveal.opponent.deck}
          />
          <Toggle
            label="手札を公開"
            registration={register('rule.debug.reveal.opponent.hand')}
            defaultChecked={DEFAULT_ROOM_SETTINGS.rule.debug.reveal.opponent.hand}
          />
          <Toggle
            label="トリガーゾーンを公開"
            registration={register('rule.debug.reveal.opponent.trigger')}
            defaultChecked={DEFAULT_ROOM_SETTINGS.rule.debug.reveal.opponent.trigger}
          />
        </div>

        <div className="mb-2 text-sm font-medium text-gray-700">自分の情報</div>
        <div className="pl-3">
          <Toggle
            label="デッキを公開"
            registration={register('rule.debug.reveal.self.deck')}
            defaultChecked={DEFAULT_ROOM_SETTINGS.rule.debug.reveal.self.deck}
          />
        </div>
      </div>
    </SettingsGroup>
  );
};
