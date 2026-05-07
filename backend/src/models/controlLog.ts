import mongoose from 'mongoose';

const controlLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: () => new Date(), index: true },
  previousTemperature: { type: Number, required: true },
  targetTemperature: { type: Number, required: true },
  pidOutput: { type: Number, required: true },
  relayState: { type: String, required: true },
  reason: { type: String, required: true },
});

export const ControlLog = mongoose.model('ControlLog', controlLogSchema);
