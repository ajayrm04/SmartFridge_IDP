interface SpoilageInputs {
  temperature: number;
  humidity: number;
  category: string;
  activationEnergy: number;
  elapsedHours: number;
}

const R = 8.314; // J/mol·K
const referenceTempKelvin = 277.15; // 4°C in Kelvin

function humidityFactor(humidity: number) {
  return 1 + Math.max(0, humidity - 60) * 0.01;
}

function categoryFactor(category: string) {
  if (category.toLowerCase().includes('fruit')) return 1.2;
  if (category.toLowerCase().includes('vegetable')) return 1.1;
  if (category.toLowerCase().includes('dairy')) return 1.4;
  return 1.0;
}

export function computeArrheniusRate(temperature: number, activationEnergy: number) {
  const tempK = temperature + 273.15;
  return Math.exp(-activationEnergy * 1000 / (R * tempK));
}

export function computeSpoilageMetrics(inputs: SpoilageInputs) {
  const baseRate = computeArrheniusRate(inputs.temperature, inputs.activationEnergy);
  const humidityAdjustment = humidityFactor(inputs.humidity);
  const categoryAdjustment = categoryFactor(inputs.category);
  const spoilageRate = baseRate * humidityAdjustment * categoryAdjustment;
  const spoilagePercentage = Math.min(100, spoilageRate * inputs.elapsedHours * 100);
  const remainingShelfLife = Math.max(0, 100 - spoilagePercentage) / (spoilageRate * 24 || 1);
  const riskLevel = spoilagePercentage > 75 ? 'critical' : spoilagePercentage > 45 ? 'warning' : 'safe';

  return {
    spoilageRate,
    spoilagePercentage,
    remainingShelfLife,
    riskLevel,
  };
}
