'use client';

import { Button } from '@/component/interface/button';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { Tooltip } from 'react-tooltip';
import { useRoomCreator } from './hooks';

// Import components
import { HandicapSettings } from './components/HandicapSettings';
import { MaxSettings } from './components/MaxSettings';
import { DrawSettings } from './components/DrawSettings';
import { CpSettings } from './components/CpSettings';
import { PlayerSettings } from './components/PlayerSettings';
import { DebugSettings } from './components/DebugSettings';
import { MiscSettings } from './components/MiscSettings';
import { JokerSettings } from './components/JokerSettings';
import type { RoomCreatorFormParams } from './type';
import { DEFAULT_ROOM_SETTINGS } from '../../constants/room';

export const RoomCreator = () => {
  const { handleSubmit: oldHandleSubmit } = useRoomCreator();
  // Use a key to force re-render NumberInput components when form is reset
  const [resetKey, setResetKey] = useState(0);

  const {
    register,
    formState: { errors },
    reset,
  } = useForm<RoomCreatorFormParams>({
    defaultValues: DEFAULT_ROOM_SETTINGS,
  });

  return (
    <div className="p-4 bg-white rounded-lg shadow-md max-w-lg mx-auto">
      <h2 className="text-center text-xl font-bold mb-4 text-gray-400">ルームを作成する</h2>
      <form onSubmit={oldHandleSubmit} className="space-y-4">
        <div className="mb-4">
          <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mb-1">
            ルーム名
          </label>
          <input
            id="roomName"
            type="text"
            {...register('name')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="省略可能"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
        </div>

        <div key={resetKey}>
          <HandicapSettings register={register} />
          <MaxSettings register={register} />
          <DrawSettings register={register} />
          <CpSettings register={register} />
          <JokerSettings register={register} />
          <PlayerSettings register={register} />
          <MiscSettings register={register} />
          <DebugSettings register={register} />
        </div>

        <div className="flex justify-between">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              reset(DEFAULT_ROOM_SETTINGS);
              // Increment key to force re-render the NumberInput components
              setResetKey(prev => prev + 1);
            }}
          >
            すべて初期設定にリセット
          </Button>
          <Button>作成</Button>
        </div>
      </form>
      <Tooltip id="strict-override">
        <span>
          このオプションを有効にすると、カード名だけでなくバージョン名などもチェック対象となります。
          <br />
          例えば、PR『見習い魔道士リーナ』・SP『見習い魔道士リーナ』・V1.0『見習い魔道士リーナ』は、
          <br />
          それぞれ異なるカードであると見なされ、オーバーライドできません。
        </span>
      </Tooltip>
    </div>
  );
};
