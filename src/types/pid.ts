export type ProcessType = 'thermal' | 'level' | 'motor' | 'pressure' | 'custom';

export interface PIDParameters {
  kp: number;
  ki: number;
  kd: number;
  nFilter: number;          // Derivative filter coefficient (typically 8 ~ 20)
  antiWindup: boolean;
  derivativeOnPV: boolean;  // Derivative on Measurement (PV) instead of Error to avoid kick
  mode: 'PID' | 'PI' | 'PD' | 'P' | 'MANUAL';
  manualOutput?: number;    // Manual output % (0 ~ 100) when in MANUAL mode
}

export interface ProcessModel {
  id: string;
  type: ProcessType;
  name: string;
  koreanName: string;
  description: string;
  order: 1 | 2;             // 1st order or 2nd order
  isIntegrating?: boolean;  // integrating process (e.g. non-leaking tank)
  gain: number;             // Process Gain K
  tau1: number;             // Time constant 1 (seconds)
  tau2: number;             // Time constant 2 (seconds, for 2nd order)
  deadTime: number;         // Dead time / time delay (seconds)
  dampingRatio?: number;    // Damping ratio zeta (for 2nd order vibration)
  initialValue: number;     // Starting PV
  unit: string;             // °C, %, RPM, bar, etc.
  pvMin: number;
  pvMax: number;
  mvMin: number;            // Controller output saturation min (e.g. 0)
  mvMax: number;            // Controller output saturation max (e.g. 100)
  defaultSetpoint: number;
  recommendedPID: PIDParameters;
}

export interface SimulationConfig {
  dt: number;               // Step time, e.g. 0.05s
  duration: number;         // Simulation duration, e.g. 50s
  setpoint: number;
  initialSetpoint: number;
  stepTime: number;         // Time when setpoint steps
  loadDisturbance: number;  // External disturbance magnitude
  disturbanceTime: number;  // Time when disturbance hits
  noiseStdDev: number;      // Gaussian sensor noise level
  setpointType: 'step' | 'ramp' | 'sine' | 'square';
  sineFreq?: number;        // Hz for sine setpoint
}

export interface SimulationDataPoint {
  time: number;
  setpoint: number;
  pv: number;               // Process Variable (actual system output)
  measuredPv: number;       // PV with measurement noise
  mv: number;               // Manipulated Variable (Controller output, saturated)
  unsaturatedMv: number;    // Pre-saturation controller output
  error: number;
  pTerm: number;
  iTerm: number;
  dTerm: number;
  disturbance: number;
}

export interface TransientMetrics {
  riseTime: number | null;        // Time to go from 10% to 90% of setpoint
  settlingTime: number | null;    // Time to stay within 2% band
  peakValue: number;
  peakTime: number | null;
  overshootPercent: number;       // (Peak - SP) / SP * 100%
  steadyStateError: number;       // SP - final PV
  iae: number;                    // Integral Absolute Error
  ise: number;                    // Integral Squared Error
  itae: number;                   // Integral Time Absolute Error
  isStable: boolean;
  statusText: string;
}

export interface AutoTuningResult {
  methodName: string;
  koreanName: string;
  description: string;
  kp: number;
  ki: number;
  kd: number;
  ti: number;
  td: number;
}
