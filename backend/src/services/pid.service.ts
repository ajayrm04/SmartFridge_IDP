interface ControlInputs {
  currentTemp: number;
  targetTemp: number;
  spoilageRate: number;
}

const pidState = {
  integral: 0,
  lastError: 0,
};

export function computeControlDecision(inputs: ControlInputs) {
  const error = inputs.currentTemp - inputs.targetTemp;
  const kp = 2.0;
  const ki = 0.15;
  const kd = 0.4;

  pidState.integral += error * 0.5;
  const derivative = error - pidState.lastError;
  pidState.lastError = error;

  const pidOutput = kp * error + ki * pidState.integral + kd * derivative;
  const relayState = pidOutput > 20 ? 'COOLING_ON' : 'COOLING_OFF';
  const reason = pidOutput > 20 ? 'temperature above target' : 'temperature stable';

  return {
    pidOutput: Number(pidOutput.toFixed(2)),
    relayState,
    reason,
  };
}
