import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let currentToken: string | null = null;
let connectionFailed = false; // stop retrying after permanent failure

const SOCKET_URL = 'http://localhost:5001';

export function getSocket(token?: string): Socket {
  // If already connected with same token, reuse
  if (socket && currentToken === token && socket.connected) return socket;

  // If connection permanently failed, don't keep creating new sockets
  if (connectionFailed && currentToken === token) return socket!;

  // Token changed — disconnect old socket
  if (socket && currentToken !== token) {
    socket.disconnect();
    socket = null;
    connectionFailed = false;
  }

  // Create new socket only if we don't have one
  if (!socket) {
    currentToken = token ?? null;
    socket = io(SOCKET_URL, {
      auth: { token: currentToken },
      transports: ['websocket'],
      autoConnect: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 5000,
      timeout: 10000,
    });

    socket.on('connect_error', () => {
      // After max retries, mark as failed so we stop creating new instances
    });

    socket.io.on('reconnect_failed', () => {
      connectionFailed = true;
    });
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentToken = null;
    connectionFailed = false;
  }
}
