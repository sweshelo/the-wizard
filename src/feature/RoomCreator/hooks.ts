import { useWebSocket } from '@/hooks/websocket/hooks';
import { LocalStorageHelper } from '@/service/local-storage';
import type {
  Message,
  RoomOpenRequestPayload,
  RoomOpenResponsePayload,
} from '@/submodule/suit/types';
import { useRouter } from 'next/navigation';
import type { FormEvent, FormEventHandler } from 'react';
import { useCallback } from 'react';

interface Response {
  handleSubmit: FormEventHandler<HTMLFormElement>;
}

export const useRoomCreator = (): Response => {
  const { websocket } = useWebSocket();
  const router = useRouter();

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      if (!websocket) return;

      e.preventDefault();

      // Get form data from the event
      const formData = new FormData(e.currentTarget);
      const formValues = Object.fromEntries(formData);

      // Extract the room name
      const roomNameValue = formValues.name;
      const roomName = typeof roomNameValue === 'string' ? roomNameValue : '';
      console.log('Form values:', formValues);

      try {
        const response = await websocket.request<RoomOpenRequestPayload, RoomOpenResponsePayload>({
          action: {
            handler: 'server',
            type: 'open',
          },
          payload: {
            type: 'RoomOpenRequest',
            requestId: LocalStorageHelper.playerId(),
            name: roomName,
            rule: {
              system: {
                round: Number(formValues['rule.system.round']),
                turnTime: Number(formValues['rule.system.turnTime']),
                draw: {
                  top: Number(formValues['rule.system.draw.top']),
                  override: Number(formValues['rule.system.draw.override']),
                  mulligan: Number(formValues['rule.system.draw.mulligan']),
                },
                handicap: {
                  draw: formValues['rule.system.handicap.draw'] === 'on',
                  cp: formValues['rule.system.handicap.cp'] === 'on',
                  attack: formValues['rule.system.handicap.attack'] === 'on',
                },
                cp: {
                  init: Number(formValues['rule.system.cp.init']),
                  increase: Number(formValues['rule.system.cp.increase']),
                  max: Number(formValues['rule.system.cp.max']),
                  ceil: Number(formValues['rule.system.cp.ceil']),
                  carryover: formValues['rule.system.cp.carryover'] === 'on',
                },
              },
              player: {
                max: {
                  life: Number(formValues['rule.player.max.life']),
                  hand: Number(formValues['rule.player.max.hand']),
                  trigger: Number(formValues['rule.player.max.trigger']),
                  field: Number(formValues['rule.player.max.field']),
                },
              },
              misc: {
                strictOverride: formValues['rule.misc.strictOverride'] === 'on',
              },
              joker: {
                suicide: formValues['rule.joker.suicide'] === 'on',
                single: formValues['rule.joker.single'] === 'on',
                inHand: formValues['rule.joker.inHand'] === 'on',
                gauge: Number(formValues['rule.joker.gauge']),
                lifeDamage: Number(formValues['rule.joker.lifeDamage']),
                maxTurnEnd: Number(formValues['rule.joker.maxTurnEnd']),
                minTurnEnd: Number(formValues['rule.joker.minTurnEnd']),
              },
              debug: {
                enable: formValues['rule.debug.enable'] === 'on',
                reveal: {
                  opponent: {
                    deck: formValues['rule.debug.reveal.opponent.deck'] === 'on',
                    hand: formValues['rule.debug.reveal.opponent.hand'] === 'on',
                    trigger: formValues['rule.debug.reveal.opponent.trigger'] === 'on',
                    trash: formValues['rule.debug.reveal.opponent.trash'] === 'on',
                  },
                  self: {
                    deck: formValues['rule.debug.reveal.self.deck'] === 'on',
                  },
                },
              },
            },
          },
        } satisfies Message<RoomOpenRequestPayload>);

        router.push(`/room/${response.payload.roomId}`);
      } catch (error) {
        console.error('Error creating room:', error);
        alert('ルームの作成に失敗しました。');
      }
    },
    [router, websocket]
  );

  return { handleSubmit };
};
