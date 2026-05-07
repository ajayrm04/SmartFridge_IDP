import { Router } from 'express';
import { getLiveSensorReadings, getSensorHistory, ingestSensorPayload } from '../controllers/sensors.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';

export const sensorsRouter = Router();

sensorsRouter.get('/live', authenticate, getLiveSensorReadings);
sensorsRouter.get('/history', authenticate, getSensorHistory);
sensorsRouter.post('/ingest', validateRequest('sensorIngest'), ingestSensorPayload);
