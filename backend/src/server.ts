// src/server.ts
import express from 'express';
import http from 'http';
import cors from 'cors';
import sensorRoutes from './routes/sensorRoutes';
import { initSocket } from './services/socketService';
import { startEspPolling } from './services/espFetcher'; // <-- IMPORT THE FETCHER

const app = express();
const server = http.createServer(app);

// 1. Middleware
app.use(cors());
app.use(express.json());

// 2. Routes (Optional now, if you are strictly polling)
app.use('/api', sensorRoutes);

// 3. Initialize WebSockets
initSocket(server);

// 4. Start the ESP Fetcher Loop <-- ADD THIS LINE
startEspPolling();

// 5. Start Server
const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});