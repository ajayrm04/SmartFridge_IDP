import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: SocketIOServer;

export const initSocket = (server: HttpServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*', // Allows your React frontend to connect from any port
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`🟢 Frontend connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`🔴 Frontend disconnected: ${socket.id}`);
    });
  });

  return io;
};

// This allows us to trigger frontend updates from our controller
export const getIo = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized!');
  }
  return io;
};