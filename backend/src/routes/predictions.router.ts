import { Router } from 'express';
import { getPredictions, getPredictionById } from '../controllers/predictions.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

export const predictionsRouter = Router();

predictionsRouter.get('/', authenticate, getPredictions);
predictionsRouter.get('/:id', authenticate, getPredictionById);
