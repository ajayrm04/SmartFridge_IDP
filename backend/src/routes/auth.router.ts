import { Router } from 'express';
import { login, register } from '../controllers/auth.controller.js';
import { validateRequest } from '../middleware/validation.middleware.js';

export const authRouter = Router();

authRouter.post('/login', validateRequest('login'), login);
authRouter.post('/register', validateRequest('register'), register);
