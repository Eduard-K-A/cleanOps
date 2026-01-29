import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { getEnv } from './config/env';

let io: SocketIOServer;

export function initializeSocket(server: HTTPServer): SocketIOServer {
  const env = getEnv();
  
  io = new SocketIOServer(server, {
    cors: {
      origin: env.SOCKET_CORS_ORIGIN.split(','),
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Join a job room
    socket.on('join_room', (data: { job_id: string; user_id: string }) => {
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
    socket.on('leave_room', (data: { job_id: string }) => {
      const roomName = `job_${data.job_id}`;
      socket.leave(roomName);
      console.log(`[Socket] Client left room ${roomName}`);
    });

    // Handle new message (message is already saved to DB via API)
    socket.on('send_message', (data: { job_id: string; message: any }) => {
      const roomName = `job_${data.job_id}`;
      // Broadcast to all clients in the room (including sender)
      io.to(roomName).emit('new_message', data.message);
      console.log(`[Socket] Message broadcasted in room ${roomName}`);
    });

    // Handle status updates
    socket.on('status_update', (data: { job_id: string; status: string; job: any }) => {
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

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initializeSocket first.');
  }
  return io;
}
