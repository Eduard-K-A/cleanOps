"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSocket = initializeSocket;
exports.getIO = getIO;
const socket_io_1 = require("socket.io");
const env_1 = require("./config/env");
let io;
function initializeSocket(server) {
    const env = (0, env_1.getEnv)();
    io = new socket_io_1.Server(server, {
        cors: {
            origin: env.SOCKET_CORS_ORIGIN.split(','),
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });
    io.on('connection', (socket) => {
        console.log(`[Socket] Client connected: ${socket.id}`);
        // Join a job room
        socket.on('join_room', (data) => {
            const roomName = `job_${data.job_id}`;
            socket.join(roomName);
            console.log(`[Socket] User ${data.user_id} joined room ${roomName}`);
            // Notify others in the room
            socket.to(roomName).emit('user_joined', {
                user_id: data.user_id,
                job_id: data.job_id,
            });
        });
        // Leave a job room
        socket.on('leave_room', (data) => {
            const roomName = `job_${data.job_id}`;
            socket.leave(roomName);
            console.log(`[Socket] Client left room ${roomName}`);
        });
        // Handle new message (message is already saved to DB via API)
        socket.on('send_message', (data) => {
            const roomName = `job_${data.job_id}`;
            // Broadcast to all clients in the room (including sender)
            io.to(roomName).emit('new_message', data.message);
            console.log(`[Socket] Message broadcasted in room ${roomName}`);
        });
        // Handle status updates
        socket.on('status_update', (data) => {
            const roomName = `job_${data.job_id}`;
            io.to(roomName).emit('job_status_updated', {
                job_id: data.job_id,
                status: data.status,
                job: data.job,
            });
            console.log(`[Socket] Status update broadcasted in room ${roomName}`);
        });
        socket.on('disconnect', () => {
            console.log(`[Socket] Client disconnected: ${socket.id}`);
        });
    });
    console.log('[Socket] Socket.io server initialized');
    return io;
}
function getIO() {
    if (!io) {
        throw new Error('Socket.io not initialized. Call initializeSocket first.');
    }
    return io;
}
//# sourceMappingURL=socket.js.map