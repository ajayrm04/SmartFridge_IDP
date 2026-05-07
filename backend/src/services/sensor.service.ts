import { Server } from 'socket.io';
import { SensorReading } from '../models/sensorReading.js';
import { Alert } from '../models/alert.js';
import { ControlLog } from '../models/controlLog.js';
import { FoodItem } from '../models/foodItem.js';
import { Recommendation } from '../models/recommendation.js';
import { computeSpoilageMetrics } from './spoilage.service.js';
import { computeControlDecision } from './pid.service.js';
import { buildAlert } from './alert.service.js';
import { requestPrediction } from './ml.service.js';
import { createRecommendation } from './recommendation.service.js';

interface SensorPayload {
  temperature: number;
  humidity: number;
  ammonia: number;
  co2: number;
  ethylene: number;
  energyConsumption: number;
  zoneId: string;
  compressorState?: boolean;
  fanState?: boolean;
}

export async function handleSensorData(payload: SensorPayload, io?: Server) {
  const reading = await SensorReading.create({
    temperature: payload.temperature,
    humidity: payload.humidity,
    ammonia: payload.ammonia,
    co2: payload.co2,
    ethylene: payload.ethylene,
    energyConsumption: payload.energyConsumption,
    compressorState: payload.compressorState ?? false,
    fanState: payload.fanState ?? false,
    zoneId: payload.zoneId,
  });

  const foodItems = await FoodItem.find().exec();
  const enriched = foodItems.map((food) => {
    const metrics = computeSpoilageMetrics({
      temperature: payload.temperature,
      humidity: payload.humidity,
      category: food.category,
      activationEnergy: food.activationEnergy,
      elapsedHours: 0.1667,
    });
    return { food, metrics };
  });

  const alerts = enriched.flatMap(({ food, metrics }) => {
    const alert = buildAlert({ food, metrics });
    return alert ? [alert] : [];
  });

  if (alerts.length > 0) {
    await Alert.insertMany(alerts.map((alert) => ({ ...alert, timestamp: new Date() })));
    io?.emit('alert-update', alerts);
  }

  const decision = computeControlDecision({
    currentTemp: payload.temperature,
    targetTemp: Number(process.env.TARGET_TEMPERATURE ?? 4),
    spoilageRate: enriched.reduce((sum, item) => sum + item.metrics.spoilageRate, 0) / Math.max(1, enriched.length),
  });

  await ControlLog.create({
    previousTemperature: payload.temperature,
    targetTemperature: Number(process.env.TARGET_TEMPERATURE ?? 4),
    pidOutput: decision.pidOutput,
    relayState: decision.relayState,
    reason: decision.reason,
  });

  io?.emit('control-update', decision);
  io?.emit('sensor-update', reading);

  const prediction = await requestPrediction({
    sensorReading: payload,
    foodItems: foodItems.map((item) => ({ category: item.category, spoilagePercentage: item.spoilagePercentage })),
  });

  const recommendation = await createRecommendation({ reading: payload, prediction });
  io?.emit('prediction-update', prediction);
  io?.emit('recommendation-update', recommendation);

  return reading;
}
