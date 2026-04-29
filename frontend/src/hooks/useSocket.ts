import { useEffect, useRef } from 'react';
import { getSocket } from '../lib/socket';
import { useAuthStore } from '../store/authStore';

// Stable socket event subscription — never causes re-renders
export function useSocketEvent<T = any>(event: string, handler: (data: T) => void) {
  const token = useAuthStore(s => s.token);
  const handlerRef = useRef<(data: T) => void>(handler);

  // Keep ref in sync without triggering effect
  handlerRef.current = handler;

  useEffect(() => {
    if (!token) return;

    let socket: ReturnType<typeof getSocket>;
    try {
      socket = getSocket(token);
    } catch {
      return;
    }

    const listener = (data: T) => handlerRef.current(data);
    socket.on(event, listener);

    return () => {
      socket.off(event, listener);
    };
  }, [event, token]); // stable deps — handler excluded intentionally
}
