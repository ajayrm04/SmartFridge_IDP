import express from 'express';
import cors from 'cors';
import sensorRoutes from './routes/sensorRoutes';

const app = express();

app.use(cors());

// IMPORTANT: Allows Express to read form-urlencoded data from the ESP
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Kept just in case you send JSON from React later

// Register all routes directly
app.use('/', sensorRoutes);

// ─── Start Server ────────────────────────────
const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});