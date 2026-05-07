import { FoodItem } from '../models/foodItem.js';
import { computeSpoilageMetrics } from './spoilage.service.js';

interface AlertCandidate {
  alertType: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
}

interface AlertBuildInput {
  food: InstanceType<typeof FoodItem>;
  metrics: ReturnType<typeof computeSpoilageMetrics>;
}

export function buildAlert(input: AlertBuildInput): AlertCandidate | null {
  if (input.metrics.spoilagePercentage > 80) {
    return {
      alertType: 'spoilage',
      severity: 'CRITICAL',
      message: `${input.food.itemName} is critically spoiled at ${input.metrics.spoilagePercentage.toFixed(0)}%`,
    };
  }

  if (input.metrics.spoilagePercentage > 60) {
    return {
      alertType: 'spoilage',
      severity: 'WARNING',
      message: `${input.food.itemName} spoilage at ${input.metrics.spoilagePercentage.toFixed(0)}%`,
    };
  }

  return null;
}
