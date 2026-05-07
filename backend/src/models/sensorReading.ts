import mongoose from 'mongoose';

const sensorReadingSchema = new mongoose.Schema({
  timestamp: { type: Date, default: () => new Date(), index: true },
  temperature: { type: Number, required: true },
  humidity: { type: Number, required: true },
  ammonia: { type: Number, required: true },
  co2: { type: Number, required: true },
  ethylene: { type: Number, required: true },
  energyConsumption: { type: Number, required: true },
  compressorState: { type: Boolean, required: true },
  fanState: { type: Boolean, required: true },
  zoneId: { type: String, required: true, index: true },
});

export const SensorReading = mongoose.model('SensorReading', sensorReadingSchema);
