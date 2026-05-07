import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  alertType: { type: String, required: true },
  severity: { type: String, enum: ['INFO', 'WARNING', 'CRITICAL'], required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: () => new Date(), index: true },
  resolved: { type: Boolean, default: false },
});

export const Alert = mongoose.model('Alert', alertSchema);
