'use client';

import { NumberInput } from '@/component/interface/numberInput';
import { SettingsGroup } from '@/component/interface/settingsGroup';
import type { UseFormRegister } from 'react-hook-form';
import type { RoomCreatorFormParams } from '../type';
import { DEFAULT_ROOM_SETTINGS } from '../../../constants/room';

interface MaxSettingsProps {
  register: UseFormRegister<RoomCreatorFormParams>;
}

export const MaxSettings: React.FC<MaxSettingsProps> = ({ register }) => {
  return (
    <SettingsGroup title="上限設定">
      <NumberInput
        label="最大ラウンド数"
        min={1}
        max={30}
        defaultValue={DEFAULT_ROOM_SETTINGS.rule.system.round}
        registration={register('rule.system.round', { valueAsNumber: true })}
      />
      <NumberInput
        label="1ターンあたりの時間 (秒)"
        min={15}
        max={300}
        defaultValue={DEFAULT_ROOM_SETTINGS.rule.system.turnTime}
        registration={register('rule.system.turnTime', { valueAsNumber: true })}
      />
    </SettingsGroup>
  );
};
