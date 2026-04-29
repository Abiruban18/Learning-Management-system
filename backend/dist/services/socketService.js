"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = initSocket;
exports.getIO = getIO;
exports.notifyUser = notifyUser;
exports.broadcastToStudents = broadcastToStudents;
exports.broadcastToQuizRoom = broadcastToQuizRoom;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = require("jsonwebtoken");
let io = null;
// Map userId -> socketId for targeted delivery
const userSockets = new Map();
function initSocket(httpServer) {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL,
            credentials: true,
        },
    });
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token)
            return next(new Error('Unauthorized'));
        try {
            const decoded = jsonwebtoken_1.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            socket.role = decoded.role;
            next();
        }
        catch {
            next(new Error('Invalid token'));
        }
    });
    io.on('connection', (socket) => {
        const userId = socket.userId;
        userSockets.set(userId, socket.id);
        // Join role-based room
        socket.join(`role:${socket.role}`);
        socket.join(`user:${userId}`);
        socket.on('disconnect', () => {
            userSockets.delete(userId);
        });
        // Live quiz room management
        socket.on('join_quiz_room', (quizId) => {
            socket.join(`quiz:${quizId}`);
        });
        socket.on('leave_quiz_room', (quizId) => {
            socket.leave(`quiz:${quizId}`);
        });
    });
    return io;
}
function getIO() {
    if (!io)
        throw new Error('Socket.io not initialized');
    return io;
}
/** Send notification to a specific user */
function notifyUser(userId, event, data) {
    getIO().to(`user:${userId}`).emit(event, data);
}
/** Broadcast to all students */
function broadcastToStudents(event, data) {
    getIO().to('role:student').emit(event, data);
}
/** Broadcast to quiz room */
function broadcastToQuizRoom(quizId, event, data) {
    getIO().to(`quiz:${quizId}`).emit(event, data);
}
