import { Router } from 'express';
import { receiveSensorData } from '../controllers/sensorController';

const router = Router();

// Route: POST /api/data
router.post('/data', receiveSensorData);

export default router;