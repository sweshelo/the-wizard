'use client';

import { NumberInput } from '@/component/interface/numberInput';
import { SettingsGroup } from '@/component/interface/settingsGroup';
import { Toggle } from '@/component/interface/toggle';
import type { UseFormRegister } from 'react-hook-form';
import type { RoomCreatorFormParams } from '../type';
import { DEFAULT_ROOM_SETTINGS } from '../../../constants/room';

interface JokerSettingsProps {
  register: UseFormRegister<RoomCreatorFormParams>;
}

export const JokerSettings: React.FC<JokerSettingsProps> = ({ register }) => {
  return (
    <SettingsGroup title="JOKER設定">
      <Toggle
        label="自傷ダメージによるゲージ増加"
        description="自傷ダメージでもジョーカーゲージが増加する"
        registration={register('rule.joker.suicide')}
        defaultChecked={DEFAULT_ROOM_SETTINGS.rule.joker.suicide}
      />
      <Toggle
        label="1stジョーカーのみ"
        description="1stジョーカーのみ使用可能にする"
        registration={register('rule.joker.single')}
        defaultChecked={DEFAULT_ROOM_SETTINGS.rule.joker.single}
      />
      <Toggle
        label="ジョーカーを手札に加える"
        description="Ver.1系 - ジョーカーが使用可能になると手札に加わる / 使用は一度のみ"
        registration={register('rule.joker.inHand')}
        defaultChecked={DEFAULT_ROOM_SETTINGS.rule.joker.inHand}
      />
      <NumberInput
        label="初期ジョーカーゲージ"
        description="ゲーム開始時のジョーカーゲージ量"
        min={0}
        max={100}
        step={0.1}
        defaultValue={DEFAULT_ROOM_SETTINGS.rule.joker.gauge}
        registration={register('rule.joker.gauge', { valueAsNumber: true })}
      />
      <NumberInput
        label="ライフダメージ時のゲージ増加量"
        description="ライフダメージを受けた時のジョーカーゲージ増加量"
        min={0}
        max={100}
        step={0.1}
        defaultValue={DEFAULT_ROOM_SETTINGS.rule.joker.lifeDamage}
        registration={register('rule.joker.lifeDamage', { valueAsNumber: true })}
      />
      <NumberInput
        label="ターン終了時の最大ゲージ増加量"
        description="ターン終了時に増加するジョーカーゲージの最大値"
        min={0}
        max={100}
        step={0.1}
        defaultValue={DEFAULT_ROOM_SETTINGS.rule.joker.maxTurnEnd}
        registration={register('rule.joker.maxTurnEnd', { valueAsNumber: true })}
      />
      <NumberInput
        label="ターン終了時の最小ゲージ増加量"
        description="ターン終了時に増加するジョーカーゲージの最小値"
        min={0}
        max={100}
        step={0.1}
        defaultValue={DEFAULT_ROOM_SETTINGS.rule.joker.minTurnEnd}
        registration={register('rule.joker.minTurnEnd', { valueAsNumber: true })}
      />
    </SettingsGroup>
  );
};
