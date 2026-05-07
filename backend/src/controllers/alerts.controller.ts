import { Request, Response } from 'express';
import { Alert } from '../models/alert.js';

export async function getActiveAlerts(req: Request, res: Response) {
  const alerts = await Alert.find({ resolved: false }).sort({ timestamp: -1 }).lean().exec();
  res.json({ data: alerts });
}

export async function resolveAlert(req: Request, res: Response) {
  const alert = await Alert.findByIdAndUpdate(req.params.id, { resolved: true }, { new: true }).lean().exec();
  if (!alert) return res.status(404).json({ message: 'Alert not found' });
  res.json({ data: alert });
}
