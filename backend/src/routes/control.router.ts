import { Router } from 'express';
import { sendCoolingCommand, updatePidSettings, getControlLogs } from '../controllers/control.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';

export const controlRouter = Router();

controlRouter.post('/cooling', authenticate, validateRequest('controlCooling'), sendCoolingCommand);
controlRouter.post('/pid', authenticate, validateRequest('pidUpdate'), updatePidSettings);
controlRouter.get('/logs', authenticate, getControlLogs);
