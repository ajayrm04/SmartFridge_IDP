import { Request, Response } from 'express';
import { ControlLog } from '../models/controlLog.js';

export async function sendCoolingCommand(req: Request, res: Response) {
  const { relayState, targetTemperature } = req.body;
  const log = await ControlLog.create({
    previousTemperature: targetTemperature,
    targetTemperature,
    pidOutput: 0,
    relayState,
    reason: 'manual override',
  });
  res.status(201).json({ data: log });
}

export async function updatePidSettings(req: Request, res: Response) {
  res.json({ message: 'PID settings updated', data: req.body });
}

export async function getControlLogs(req: Request, res: Response) {
  const logs = await ControlLog.find().sort({ timestamp: -1 }).limit(100).lean().exec();
  res.json({ data: logs });
}
