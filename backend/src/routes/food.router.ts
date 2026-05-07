import { Router } from 'express';
import { getFoodItems, createFoodItem, updateFoodItem, deleteFoodItem } from '../controllers/food.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';

export const foodRouter = Router();

foodRouter.get('/', authenticate, getFoodItems);
foodRouter.post('/', authenticate, validateRequest('foodCreate'), createFoodItem);
foodRouter.put('/:id', authenticate, validateRequest('foodUpdate'), updateFoodItem);
foodRouter.delete('/:id', authenticate, deleteFoodItem);
