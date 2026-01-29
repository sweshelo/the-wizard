import { useContext } from 'react';
import type { WebSocketContextType } from '.';
import { WebSocketContext } from '.';

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === null || context === undefined) {
    throw Error('useWebsocket must be used within a WebSocketProvider');
  }
  return context;
};
