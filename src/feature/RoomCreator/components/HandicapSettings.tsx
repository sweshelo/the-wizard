'use client';

import { SettingsGroup } from '@/component/interface/settingsGroup';
import { Toggle } from '@/component/interface/toggle';
import type { UseFormRegister } from 'react-hook-form';
import type { RoomCreatorFormParams } from '../type';
import { DEFAULT_ROOM_SETTINGS } from '../../../constants/room';

interface HandicapSettingsProps {
  register: UseFormRegister<RoomCreatorFormParams>;
}

export const HandicapSettings: React.FC<HandicapSettingsProps> = ({ register }) => {
  return (
    <SettingsGroup title="ハンディキャップ設定">
      <Toggle
        label="先攻1ターン目のドローを無効にする"
        registration={register('rule.system.handicap.draw')}
        defaultChecked={DEFAULT_ROOM_SETTINGS.rule.system.handicap.draw}
      />
      <Toggle
        label="先攻1ターン目の攻撃を禁止する"
        registration={register('rule.system.handicap.attack')}
        defaultChecked={DEFAULT_ROOM_SETTINGS.rule.system.handicap.attack}
      />
      <Toggle
        label="先攻1ターン目のCP増加を無効にする"
        registration={register('rule.system.handicap.cp')}
        defaultChecked={DEFAULT_ROOM_SETTINGS.rule.system.handicap.cp}
      />
    </SettingsGroup>
  );
};
