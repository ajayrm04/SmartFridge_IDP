import express from 'express';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/db.js';
import { apiRouter } from './routes/api.router.js';
import { initSocketServer } from './socket/socket.js';
import { scheduleBackgroundJobs } from './services/cron.service.js';
import { errorHandler } from './middleware/error.middleware.js';
import { setIoInstance } from './socket/socket.shared.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN ?? '*',
    methods: ['GET', 'POST'],
  },
});

setIoInstance(io);

app.use(cors({ origin: process.env.FRONTEND_ORIGIN ?? '*' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api', apiRouter);
app.use(errorHandler);

initSocketServer(io);
connectDatabase();
scheduleBackgroundJobs(io);

const port = Number(process.env.PORT ?? 4000);
server.listen(port, () => {
  console.log(`IntelliFridge backend running on http://localhost:${port}`);
});
