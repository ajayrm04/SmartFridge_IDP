import { Router } from 'express';
import { getSpoilageLive, getSpoilageHistory, getSpoilageById } from '../controllers/spoilage.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

export const spoilageRouter = Router();

spoilageRouter.get('/live', authenticate, getSpoilageLive);
spoilageRouter.get('/history', authenticate, getSpoilageHistory);
spoilageRouter.get('/:id', authenticate, getSpoilageById);
