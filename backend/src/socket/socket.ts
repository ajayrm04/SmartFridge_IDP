import { Server } from 'socket.io';
import { handleSensorData } from '../services/sensor.service.js';

export function initSocketServer(io: Server) {
  io.on('connection', (socket) => {
    console.log('[SOCKET] Client connected:', socket.id);

    socket.on('sensor-data', async (payload) => {
      try {
        const reading = await handleSensorData(payload, io);
        socket.emit('sensor-ack', { status: 'ok', reading });
      } catch (error) {
        socket.emit('sensor-error', { message: (error as Error).message });
      }
    });

    socket.on('heartbeat', () => {
      socket.emit('heartbeat-ack', { timestamp: new Date().toISOString() });
    });

    socket.on('disconnect', () => {
      console.log('[SOCKET] Client disconnected:', socket.id);
    });
  });
}
