import { Request, Response } from 'express';
import { Prediction } from '../models/prediction.js';

export async function getPredictions(req: Request, res: Response) {
  const predictions = await Prediction.find().sort({ timestamp: -1 }).limit(100).lean().exec();
  res.json({ data: predictions });
}

export async function getPredictionById(req: Request, res: Response) {
  const prediction = await Prediction.findById(req.params.id).lean().exec();
  if (!prediction) return res.status(404).json({ message: 'Prediction not found' });
  res.json({ data: prediction });
}
