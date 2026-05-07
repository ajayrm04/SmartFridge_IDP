import { Request, Response } from 'express';
import { SensorReading } from '../models/sensorReading.js';
import { handleSensorData } from '../services/sensor.service.js';
import { io } from '../socket/socket.shared.js';

export async function getLiveSensorReadings(req: Request, res: Response) {
  const reading = await SensorReading.findOne().sort({ timestamp: -1 }).lean().exec();
  res.json({ data: reading });
}

export async function getSensorHistory(req: Request, res: Response) {
  const { startDate, endDate, zoneId } = req.query;
  const filter: any = {};
  if (startDate) filter.timestamp = { $gte: new Date(String(startDate)) };
  if (endDate) filter.timestamp = { ...(filter.timestamp ?? {}), $lte: new Date(String(endDate)) };
  if (zoneId) filter.zoneId = String(zoneId);
  const readings = await SensorReading.find(filter).sort({ timestamp: -1 }).limit(500).lean().exec();
  res.json({ data: readings });
}

export async function ingestSensorPayload(req: Request, res: Response) {
  const reading = await handleSensorData(req.body, io);
  res.status(201).json({ data: reading });
}
