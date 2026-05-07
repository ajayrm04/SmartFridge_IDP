import { Request, Response } from 'express';
import { FoodItem } from '../models/foodItem.js';

export async function getFoodItems(req: Request, res: Response) {
  const items = await FoodItem.find().sort({ dateStored: -1 }).lean().exec();
  res.json({ data: items });
}

export async function createFoodItem(req: Request, res: Response) {
  const item = await FoodItem.create({
    itemName: req.body.itemName,
    category: req.body.category,
    storageZone: req.body.storageZone,
    expectedShelfLife: req.body.expectedShelfLife,
    activationEnergy: req.body.activationEnergy,
    remainingShelfLife: req.body.expectedShelfLife,
  });
  res.status(201).json({ data: item });
}

export async function updateFoodItem(req: Request, res: Response) {
  const item = await FoodItem.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean().exec();
  if (!item) return res.status(404).json({ message: 'Food item not found' });
  res.json({ data: item });
}

export async function deleteFoodItem(req: Request, res: Response) {
  await FoodItem.findByIdAndDelete(req.params.id).exec();
  res.status(204).end();
}
