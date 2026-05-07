// Arrhenius spoilage engine + PID controller (pure TS, runs server-side)

export const R = 8.314; // J/(mol·K)

// Reference: shelf life is calibrated at 4°C (277.15 K) for each food item.
// activation_energy is in kJ/mol; converted to J/mol inside.
const T_REF_K = 277.15;
const A_PRE = 1; // pre-exponential constant — we use ratio so it cancels

/** Arrhenius rate constant (relative to reference). */
export function arrheniusRate(tempC: number, EaKJ: number): number {
  const T = tempC + 273.15;
  const Ea = EaKJ * 1000;
  // k(T) / k(Tref) = exp( -Ea/R * (1/T - 1/Tref) )
  return Math.exp(-(Ea / R) * (1 / T - 1 / T_REF_K));
}

/** Humidity acceleration factor: dry/ideal ~1.0, very humid has stronger impact. */
export function humidityFactor(rh: number): number {
  if (rh <= 60) return 1;
  return 1 + Math.min((rh - 60) / 30, 1) * 1.0;
}

export function ammoniaFactor(ppm: number): number {
  if (ppm <= 0.3) return 1;
  return 1 + Math.min(ppm / 2, 1) * 1.8;
}

/**
 * Compute spoilage delta % for a time window dtHours
 * given current sensor conditions and a food item.
 */
export function spoilageDelta(opts: {
  tempC: number;
  rh: number;
  ammonia: number;
  category: string;
  baseShelfLifeHours: number;
  EaKJ: number;
  dtHours: number;
}): number {
  const k = Math.pow(arrheniusRate(opts.tempC, opts.EaKJ), 1.2);
  const h = humidityFactor(opts.rh);
  const g = ammoniaFactor(opts.ammonia);
  // Base degradation per hour at reference = 100/baseShelfLifeHours
  const ratePctPerHour = (100 / opts.baseShelfLifeHours) * k * h * g;
  return ratePctPerHour * opts.dtHours;
}

export function remainingHours(spoilagePct: number, currentRatePctPerHour: number): number {
  if (currentRatePctPerHour <= 0) return Infinity;
  return Math.max(0, (100 - spoilagePct) / currentRatePctPerHour);
}

/**
 * Calculate real-time spoilage percentage based on time elapsed since storage
 */
export function calculateRealTimeSpoilage(opts: {
  storedAt: string;
  currentTime: Date;
  tempC: number;
  rh: number;
  ammonia: number;
  category: string;
  baseShelfLifeHours: number;
  EaKJ: number;
}): number {
  const storedTime = new Date(opts.storedAt);
  const elapsedHours = (opts.currentTime.getTime() - storedTime.getTime()) / (1000 * 60 * 60);

  if (elapsedHours <= 0) return 0;

  const k = Math.pow(arrheniusRate(opts.tempC, opts.EaKJ), 1.2);
  const h = humidityFactor(opts.rh);
  const g = ammoniaFactor(opts.ammonia);
  const ratePctPerHour = (100 / opts.baseShelfLifeHours) * k * h * g;

  return Math.min(100, ratePctPerHour * elapsedHours);
}

/** Simple PID step for cooling control. */
export interface PIDState { integral: number; lastError: number }
export function pidStep(
  current: number,
  target: number,
  state: PIDState,
  k: { kp: number; ki: number; kd: number },
  dt: number,
): { output: number; state: PIDState } {
  const err = current - target; // positive = too warm => need cooling
  const integral = state.integral + err * dt;
  const derivative = (err - state.lastError) / Math.max(dt, 0.0001);
  const raw = k.kp * err + k.ki * integral + k.kd * derivative;
  const output = Math.max(0, Math.min(100, raw * 10));
  return { output, state: { integral, lastError: err } };
}
