'use client';

import { NumberInput } from '@/component/interface/numberInput';
import { SettingsGroup } from '@/component/interface/settingsGroup';
import type { UseFormRegister } from 'react-hook-form';
import type { RoomCreatorFormParams } from '../type';
import { DEFAULT_ROOM_SETTINGS } from '../../../constants/room';

interface PlayerSettingsProps {
  register: UseFormRegister<RoomCreatorFormParams>;
}

export const PlayerSettings: React.FC<PlayerSettingsProps> = ({ register }) => {
  return (
    <SettingsGroup title="プレイヤー設定">
      <NumberInput
        label="ライフ"
        description="初期ライフポイント"
        min={1}
        max={20}
        defaultValue={DEFAULT_ROOM_SETTINGS.rule.player.max.life}
        registration={register('rule.player.max.life', { valueAsNumber: true })}
      />
      <NumberInput
        label="手札の上限"
        description="最大手札枚数 ※何枚でもプレイには問題ありませんが12枚以上にするとUIが崩れます"
        min={1}
        max={15}
        defaultValue={DEFAULT_ROOM_SETTINGS.rule.player.max.hand}
        registration={register('rule.player.max.hand', { valueAsNumber: true })}
      />
      <NumberInput
        label="トリガーの上限"
        description="セット可能なトリガーの最大枚数"
        min={0}
        max={10}
        defaultValue={DEFAULT_ROOM_SETTINGS.rule.player.max.trigger}
        registration={register('rule.player.max.trigger', { valueAsNumber: true })}
      />
      <NumberInput
        label="フィールドの上限"
        description="フィールドに出すことが出来る最大ユニット数"
        min={0}
        max={10}
        defaultValue={DEFAULT_ROOM_SETTINGS.rule.player.max.field}
        registration={register('rule.player.max.field', { valueAsNumber: true })}
      />
    </SettingsGroup>
  );
};
