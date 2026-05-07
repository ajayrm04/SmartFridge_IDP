import mongoose from 'mongoose';

const recommendationSchema = new mongoose.Schema({
  timestamp: { type: Date, default: () => new Date(), index: true },
  recommendation: { type: String, required: true },
  severity: { type: String, enum: ['INFO', 'WARNING', 'CRITICAL'], required: true },
  generatedFrom: { type: String, required: true },
});

export const Recommendation = mongoose.model('Recommendation', recommendationSchema);
