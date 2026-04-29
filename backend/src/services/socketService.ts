import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { verify } from 'jsonwebtoken';

let io: SocketServer | null = null;

// Map userId -> socketId for targeted delivery
const userSockets = new Map<string, string>();

export function initSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
    },
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Unauthorized'));
    try {
      const decoded = (verify as any)(token, process.env.JWT_SECRET!) as { id: string; role: string };
      (socket as any).userId = decoded.id;
      (socket as any).role   = decoded.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId as string;
    userSockets.set(userId, socket.id);

    // Join role-based room
    socket.join(`role:${(socket as any).role}`);
    socket.join(`user:${userId}`);

    socket.on('disconnect', () => {
      userSockets.delete(userId);
    });

    // Live quiz room management
    socket.on('join_quiz_room', (quizId: string) => {
      socket.join(`quiz:${quizId}`);
    });
    socket.on('leave_quiz_room', (quizId: string) => {
      socket.leave(`quiz:${quizId}`);
    });
    // Live quiz PIN room
    socket.on('join_live', (pin: string) => {
      socket.join(`live:${pin}`);
    });
    socket.on('leave_live', (pin: string) => {
      socket.leave(`live:${pin}`);
    });
  });

  return io;
}

export function getIO(): SocketServer {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

/** Send notification to a specific user */
export function notifyUser(userId: string, event: string, data: object) {
  getIO().to(`user:${userId}`).emit(event, data);
}

/** Broadcast to all students */
export function broadcastToStudents(event: string, data: object) {
  getIO().to('role:student').emit(event, data);
}

/** Broadcast to quiz room */
export function broadcastToQuizRoom(quizId: string, event: string, data: object) {
  getIO().to(`quiz:${quizId}`).emit(event, data);
}
