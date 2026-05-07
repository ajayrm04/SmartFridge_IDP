import { Request, Response } from 'express';
import { SensorReading } from '../models/sensorReading.js';
import { ControlLog } from '../models/controlLog.js';
import { FoodItem } from '../models/foodItem.js';

export async function getEnergyAnalytics(req: Request, res: Response) {
  const readings = await SensorReading.find().sort({ timestamp: -1 }).limit(200).lean().exec();
  const totalEnergy = readings.reduce((sum, item) => sum + item.energyConsumption, 0);
  const avgEnergy = readings.length ? totalEnergy / readings.length : 0;
  res.json({ data: { averageEnergy: avgEnergy, peakEnergy: Math.max(...readings.map((r) => r.energyConsumption), 0) } });
}

export async function getSpoilageAnalytics(req: Request, res: Response) {
  const items = await FoodItem.find().lean().exec();
  const activeCount = items.length;
  const criticalCount = items.filter((item) => item.riskLevel === 'critical').length;
  res.json({ data: { activeCount, criticalCount, averageSpoilage: items.reduce((sum, item) => sum + item.spoilagePercentage, 0) / Math.max(1, items.length) } });
}

export async function getPerformanceAnalytics(req: Request, res: Response) {
  const logs = await ControlLog.find().sort({ timestamp: -1 }).limit(200).lean().exec();
  res.json({ data: { controlEvents: logs.length, lastRelayState: logs[0]?.relayState ?? null } });
}
