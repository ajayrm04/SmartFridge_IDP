import axios from 'axios';

export async function requestPrediction(payload: any) {
  const mlUrl = process.env.ML_SERVICE_URL ?? 'http://localhost:5000';
  try {
    const response = await axios.post(`${mlUrl}/predict`, payload, { timeout: 5000 });
    return response.data;
  } catch (error) {
    console.warn('[ML] Prediction service unreachable, using fallback', (error as Error).message);
    return {
      spoilageProbability: 0.15,
      predictedSpoilageTime: new Date(Date.now() + 24 * 3600 * 1000),
      confidenceScore: 0.55,
    };
  }
}
