import { Router } from 'express';
import { getActiveAlerts, resolveAlert } from '../controllers/alerts.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

export const alertsRouter = Router();

alertsRouter.get('/', authenticate, getActiveAlerts);
alertsRouter.put('/:id/resolve', authenticate, resolveAlert);
