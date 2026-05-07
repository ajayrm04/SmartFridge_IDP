import { Server } from 'socket.io';

export let io: Server;

export function setIoInstance(instance: Server) {
  io = instance;
}
