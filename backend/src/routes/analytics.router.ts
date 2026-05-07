import { Router } from 'express';
import { getEnergyAnalytics, getSpoilageAnalytics, getPerformanceAnalytics } from '../controllers/analytics.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

export const analyticsRouter = Router();

analyticsRouter.get('/energy', authenticate, getEnergyAnalytics);
analyticsRouter.get('/spoilage', authenticate, getSpoilageAnalytics);
analyticsRouter.get('/performance', authenticate, getPerformanceAnalytics);
