import { useAuth } from '@/hooks/auth/hooks';
import { STARTER_DECK, STARTER_JOKERS } from '@/constants/deck';
import { useHandler } from '@/hooks/game/handler';
import { useWebSocket } from '@/hooks/websocket/hooks';
import { LocalStorageHelper } from '@/service/local-storage';
import { Message, PlayerEntryPayload } from '@/submodule/suit/types';
import { useEffect, useRef, useState } from 'react';

interface Props {
  id: string;
}
export const useGameComponentHook = ({ id }: Props) => {
  const { user } = useAuth();
  const { websocket } = useWebSocket();
  const [isConnected, setConnected] = useState<boolean>(websocket?.isConnected() ?? false);
  const isJoined = useRef(false);
  const { handle } = useHandler();

  // Discordログイン中はDiscord名・SupabaseユーザーIDを使用、未ログインはlocalStorageを使用
  const playerName =
    user?.user_metadata?.full_name || user?.user_metadata?.name || LocalStorageHelper.playerName();
  const playerId = user?.id || LocalStorageHelper.playerId();

  // ルーム参加処理
  useEffect(() => {
    if (websocket && isConnected && !isJoined.current && id) {
      isJoined.current = true;
      const deck = LocalStorageHelper.getMainDeck();
      websocket?.on('message', (message: Message) => {
        handle(message);
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
            name: playerName,
            id: playerId,
            deck: deck?.cards ?? STARTER_DECK,
          },
          jokersOwned: deck?.jokers ?? STARTER_JOKERS,
        },
      } satisfies Message<PlayerEntryPayload>);
    }
  }, [id, websocket, isConnected, handle, playerName, playerId]);

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
