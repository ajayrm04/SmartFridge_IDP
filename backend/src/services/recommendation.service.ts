import { Recommendation } from '../models/recommendation.js';

interface RecommendationInput {
  reading: {
    temperature: number;
    humidity: number;
    ammonia: number;
    co2: number;
    ethylene: number;
    energyConsumption: number;
    zoneId: string;
  };
  prediction: any;
}

export async function createRecommendation(input: RecommendationInput) {
  const severity = input.reading.temperature > Number(process.env.TARGET_TEMPERATURE ?? 4) + 2 ? 'WARNING' : 'INFO';
  const recommendation = `Temperature ${input.reading.temperature.toFixed(1)}°C is above target; consider boosting cooling.`;
  const record = await Recommendation.create({
    recommendation,
    severity,
    generatedFrom: 'sensor-pipeline',
  });
  return record;
}
