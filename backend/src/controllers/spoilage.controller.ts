import { Request, Response } from 'express';
import { FoodItem } from '../models/foodItem.js';
import { SensorReading } from '../models/sensorReading.js';
import { computeSpoilageMetrics } from '../services/spoilage.service.js';

export async function getSpoilageLive(req: Request, res: Response) {
  const latestReading = await SensorReading.findOne().sort({ timestamp: -1 }).lean().exec();
  const food = await FoodItem.find().lean().exec();
  const metrics = food.map((item) => {
    const computed = computeSpoilageMetrics({
      temperature: latestReading?.temperature ?? 4,
      humidity: latestReading?.humidity ?? 60,
      category: item.category,
      activationEnergy: item.activationEnergy,
      elapsedHours: 0.25,
    });
    return { item, metrics: computed };
  });
  res.json({ data: metrics });
}

export async function getSpoilageHistory(req: Request, res: Response) {
  const readings = await SensorReading.find().sort({ timestamp: -1 }).limit(200).lean().exec();
  res.json({ data: readings.map((r) => ({ timestamp: r.timestamp, temperature: r.temperature, humidity: r.humidity })) });
}

export async function getSpoilageById(req: Request, res: Response) {
  const item = await FoodItem.findById(req.params.id).lean().exec();
  if (!item) return res.status(404).json({ message: 'Food item not found' });
  res.json({ data: item });
}
