import { STARTER_DECK } from '@/constants/deck';
import { useHandler } from '@/hooks/game/handler';
import { useWebSocket } from '@/hooks/websocket/hooks';
import { LocalStorageHelper } from '@/service/local-storage';
import type { Message, PlayerEntryPayload } from '@/submodule/suit/types';
import { useEffect, useRef, useState } from 'react';

interface Props {
  id: string;
}
export const useGameComponentHook = ({ id }: Props) => {
  const { websocket } = useWebSocket();
  const [isConnected, setConnected] = useState<boolean>(websocket?.isConnected() ?? false);
  const isJoined = useRef(false);
  const { handle } = useHandler();

  // ルーム参加処理
  useEffect(() => {
    if (websocket && isConnected && !isJoined.current && id) {
      isJoined.current = true;
      const deck = LocalStorageHelper.getMainDeck();
      websocket?.on('message', (message: Message) => {
        void handle(message);
      });
      websocket.send({
        action: {
          handler: 'room',
          type: 'join',
        },
        payload: {
          type: 'PlayerEntry',
          roomId: id,
          player: {
            name: LocalStorageHelper.playerName(),
            id: LocalStorageHelper.playerId(),
            deck: deck?.cards ?? STARTER_DECK,
          },
          jokersOwned: deck?.jokers ?? ['ルインリード', 'ソウルエクスキューション'],
        },
      } satisfies Message<PlayerEntryPayload>);
    }
  }, [id, websocket, isConnected, handle]);

  useEffect(() => {
    if (websocket) {
      // Set initial state based on current connection state
      setConnected(websocket.isConnected());

      // Set up listener for future state changes
      websocket.on('open', () => setConnected(true));
      websocket.on('close', () => setConnected(false));
    }
  }, [websocket]);
};
