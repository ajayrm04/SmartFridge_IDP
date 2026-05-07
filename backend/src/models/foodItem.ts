import mongoose from 'mongoose';

const foodItemSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  category: { type: String, required: true },
  storageZone: { type: String, required: true },
  dateStored: { type: Date, default: () => new Date() },
  expectedShelfLife: { type: Number, required: true },
  activationEnergy: { type: Number, required: true },
  spoilagePercentage: { type: Number, default: 0 },
  remainingShelfLife: { type: Number, default: 0 },
  spoilageRate: { type: Number, default: 0 },
  riskLevel: { type: String, default: 'safe' },
});

export const FoodItem = mongoose.model('FoodItem', foodItemSchema);
