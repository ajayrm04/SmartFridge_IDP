import mongoose from 'mongoose';

const predictionSchema = new mongoose.Schema({
  timestamp: { type: Date, default: () => new Date(), index: true },
  foodCategory: { type: String, required: true },
  spoilageProbability: { type: Number, required: true },
  predictedSpoilageTime: { type: Date, required: true },
  confidenceScore: { type: Number, required: true },
});

export const Prediction = mongoose.model('Prediction', predictionSchema);
