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

/** Humidity acceleration factor: dry/ideal ~1.0, very humid up to ~1.6. */
export function humidityFactor(rh: number): number {
  if (rh <= 60) return 1;
  return 1 + Math.min((rh - 60) / 40, 1) * 0.6;
}

export function ethyleneFactor(ppm: number, category: string): number {
  if (category === "fruits" || category === "vegetables") {
    return 1 + Math.min(ppm / 50, 1) * 0.4;
  }
  return 1;
}

/**
 * Compute spoilage delta % for a time window dtHours
 * given current sensor conditions and a food item.
 */
export function spoilageDelta(opts: {
  tempC: number;
  rh: number;
  ethylene: number;
  category: string;
  baseShelfLifeHours: number;
  EaKJ: number;
  dtHours: number;
}): number {
  const k = arrheniusRate(opts.tempC, opts.EaKJ);
  const h = humidityFactor(opts.rh);
  const e = ethyleneFactor(opts.ethylene, opts.category);
  // Base degradation per hour at reference = 100/baseShelfLifeHours
  const ratePctPerHour = (100 / opts.baseShelfLifeHours) * k * h * e;
  return ratePctPerHour * opts.dtHours;
}

export function remainingHours(spoilagePct: number, currentRatePctPerHour: number): number {
  if (currentRatePctPerHour <= 0) return Infinity;
  return Math.max(0, (100 - spoilagePct) / currentRatePctPerHour);
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
