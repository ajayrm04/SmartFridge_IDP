import express from 'express';
import cors from 'cors';
import sensorRoutes from './routes/sensorRoutes';

const app = express();

// Middleware
app.use(cors());

// IMPORTANT: Allows Express to read form-urlencoded data from the ESP
app.use(express.urlencoded({ extended: true }));
// Allows Express to read JSON data (useful if React sends POST requests later)
app.use(express.json()); 

// Attach all the routes defined in sensorRoutes.ts to the root URL
app.use('/', sensorRoutes);

// ─── Start Server ────────────────────────────
const PORT = 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Intelligent Fridge Server running on port ${PORT}`);
  console.log(`📡 ESP POST data to: http://<YOUR_IP>:${PORT}/sensor-data`);
  console.log(`💻 React GET data from: http://<YOUR_IP>:${PORT}/data`);
});