import { Router } from 'express';
import { authRouter } from './auth.router.js';
import { sensorsRouter } from './sensors.router.js';
import { foodRouter } from './food.router.js';
import { spoilageRouter } from './spoilage.router.js';
import { predictionsRouter } from './predictions.router.js';
import { alertsRouter } from './alerts.router.js';
import { controlRouter } from './control.router.js';
import { analyticsRouter } from './analytics.router.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/sensors', sensorsRouter);
apiRouter.use('/food', foodRouter);
apiRouter.use('/spoilage', spoilageRouter);
apiRouter.use('/predictions', predictionsRouter);
apiRouter.use('/alerts', alertsRouter);
apiRouter.use('/control', controlRouter);
apiRouter.use('/analytics', analyticsRouter);
