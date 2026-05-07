import cron from 'node-cron';
import { Server } from 'socket.io';
import { SensorReading } from '../models/sensorReading.js';
import { computeSpoilageMetrics } from './spoilage.service.js';
import { Alert } from '../models/alert.js';
import { buildAlert } from './alert.service.js';

export function scheduleBackgroundJobs(io: Server) {
  cron.schedule('*/5 * * * *', async () => {
    const latest = await SensorReading.findOne().sort({ timestamp: -1 }).lean().exec();
    if (!latest) return;

    const foodItems = await import('../models/foodItem.js').then((m) => m.FoodItem.find().exec());
    const alerts = foodItems.flatMap((food: any) => {
      const metrics = computeSpoilageMetrics({
        temperature: latest.temperature,
        humidity: latest.humidity,
        category: food.category,
        activationEnergy: food.activationEnergy,
        elapsedHours: 0.0833,
      });
      const alert = buildAlert({ food, metrics });
      return alert ? [alert] : [];
    });

    if (alerts.length > 0) {
      await Alert.insertMany(alerts.map((alert) => ({ ...alert, timestamp: new Date() })));
      io.emit('alert-update', alerts);
    }
  });

  console.log('[CRON] Scheduled background jobs');
}
