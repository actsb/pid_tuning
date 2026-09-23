import { PIDParameters, ProcessModel, SimulationConfig, SimulationDataPoint } from '../types/pid';

// Box-Muller transform for pseudo-random Gaussian noise
function gaussianRandom(mean = 0, stdev = 1): number {
  const u = 1 - Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdev + mean;
}

export class ProcessSimulatorState {
  process: ProcessModel;
  pid: PIDParameters;
  config: SimulationConfig;

  // Process state variables
  pv: number;               // Current actual process variable
  pvDerivative: number;     // For 2nd order systems
  integralTerm: number;
  filteredDerivative: number;
  lastPv: number;
  lastError: number;
  lastMv: number;

  // Delay buffer for dead-time theta
  delayBuffer: number[];
  delayBufferIndex: number;
  delayBufferSize: number;

  currentTime: number;

  constructor(process: ProcessModel, pid: PIDParameters, config: SimulationConfig) {
    this.process = process;
    this.pid = pid;
    this.config = config;

    this.pv = process.initialValue;
    this.pvDerivative = 0;
    this.integralTerm = 0;
    this.filteredDerivative = 0;
    this.lastPv = process.initialValue;
    this.lastError = 0;
    this.lastMv = 0;
    this.currentTime = 0;

    // Allocate delay buffer: size = ceil(deadTime / dt) + 1
    const dt = Math.max(0.001, config.dt);
    this.delayBufferSize = Math.max(1, Math.ceil(Math.max(0, process.deadTime) / dt));
    this.delayBuffer = new Array(this.delayBufferSize).fill(0);
    this.delayBufferIndex = 0;
  }

  reset(): void {
    this.pv = this.process.initialValue;
    this.pvDerivative = 0;
    this.integralTerm = 0;
    this.filteredDerivative = 0;
    this.lastPv = this.process.initialValue;
    this.lastError = 0;
    this.lastMv = 0;
    this.currentTime = 0;
    this.delayBuffer.fill(0);
    this.delayBufferIndex = 0;
  }

  step(
    targetSetpoint: number,
    externalDisturbance = 0,
    forceManualOutput?: number
  ): SimulationDataPoint {
    const dt = Math.max(0.001, this.config.dt);
    const { kp, ki, kd, nFilter, antiWindup, derivativeOnPV, mode } = this.pid;
    const { mvMin, mvMax, pvMin, pvMax, gain, tau1, tau2, order, isIntegrating } = this.process;

    // Measurement noise
    const noise = this.config.noiseStdDev > 0 ? gaussianRandom(0, this.config.noiseStdDev) : 0;
    const measuredPv = this.pv + noise;

    // Error calculation
    const error = targetSetpoint - measuredPv;

    let pTerm = 0;
    let iTerm = 0;
    let dTerm = 0;
    let unsaturatedMv = 0;
    let mv = 0;

    if (mode === 'MANUAL' || forceManualOutput !== undefined) {
      mv = forceManualOutput ?? this.pid.manualOutput ?? 0;
      unsaturatedMv = mv;
      pTerm = 0;
      iTerm = 0;
      dTerm = 0;
    } else {
      // 1. Proportional Term
      pTerm = kp * error;

      // 2. Derivative Term with 1st-order lowpass filter (N)
      // Filter constant alpha = Td / (Td + N * dt)
      // Standard PID: Td = Kd / Kp (if Kp > 0)
      const Td = kp > 0.0001 ? kd / kp : 0;
      const N = Math.max(1, nFilter);

      if (kd > 0 && (mode === 'PID' || mode === 'PD')) {
        const delta = derivativeOnPV ? -(measuredPv - this.lastPv) : (error - this.lastError);
        // Discrete filtered derivative:
        // D[k] = (Td / (Td + N * dt)) * D[k-1] + (Kp * N * Td / (Td + N * dt)) * (delta / dt)
        // In parallel form:
        const denom = Td + N * dt;
        if (denom > 1e-6) {
          const alpha = Td / denom;
          const beta = (kd * N) / denom;
          this.filteredDerivative = alpha * this.filteredDerivative + beta * (delta / dt);
          dTerm = this.filteredDerivative;
        } else {
          dTerm = (kd * delta) / dt;
        }
      } else {
        this.filteredDerivative = 0;
        dTerm = 0;
      }

      // Check tentative sum for anti-windup clamping
      const candidatePAndD = (mode === 'P' ? pTerm : 0) +
        (mode === 'PD' ? pTerm + dTerm : 0) +
        (mode === 'PI' ? pTerm : 0) +
        (mode === 'PID' ? pTerm + dTerm : 0);

      // 3. Integral Term (Euler integration)
      if (ki > 0 && (mode === 'PID' || mode === 'PI')) {
        const tentativeI = this.integralTerm + ki * error * dt;
        const tentativeTotal = candidatePAndD + tentativeI;

        // Anti-windup conditional clamping
        if (antiWindup) {
          const isSaturatedHigh = tentativeTotal > mvMax && error > 0;
          const isSaturatedLow = tentativeTotal < mvMin && error < 0;
          if (!isSaturatedHigh && !isSaturatedLow) {
            this.integralTerm = tentativeI;
          }
        } else {
          this.integralTerm = tentativeI;
        }
        iTerm = this.integralTerm;
      } else {
        this.integralTerm = 0;
        iTerm = 0;
      }

      // Total unsaturated controller output
      switch (mode) {
        case 'P':
          unsaturatedMv = pTerm;
          break;
        case 'PI':
          unsaturatedMv = pTerm + iTerm;
          break;
        case 'PD':
          unsaturatedMv = pTerm + dTerm;
          break;
        case 'PID':
        default:
          unsaturatedMv = pTerm + iTerm + dTerm;
          break;
      }

      // Actuator Saturation limits [mvMin, mvMax]
      mv = Math.min(mvMax, Math.max(mvMin, unsaturatedMv));
    }

    // 4. Plant Delay (Dead time) Ring Buffer
    // Store current MV into delay ring buffer, read out delayed MV
    this.delayBuffer[this.delayBufferIndex] = mv;
    const delayedMvIndex = (this.delayBufferIndex + 1) % this.delayBufferSize;
    const effectiveMv = this.delayBuffer[delayedMvIndex];
    this.delayBufferIndex = delayedMvIndex;

    // Total effective input to plant including load disturbance
    const totalPlantInput = effectiveMv + externalDisturbance;

    // 5. Numerical Simulation of Plant Dynamics
    // Sub-stepping for high precision ODE solving
    const subSteps = 4;
    const subDt = dt / subSteps;

    for (let s = 0; s < subSteps; s++) {
      if (isIntegrating) {
        // Pure integrating plant: dPV/dt = (K * u) / tau1
        const dPv = (gain * totalPlantInput) / Math.max(0.01, tau1);
        this.pv += dPv * subDt;
      } else if (order === 2 && tau2 > 0) {
        // 2nd Order SOPDT: tau1*tau2 * d^2PV/dt^2 + (tau1+tau2)*dPV/dt + PV = K * u
        const tau1Effective = Math.max(0.01, tau1);
        const tau2Effective = Math.max(0.01, tau2);
        const a1 = (tau1Effective + tau2Effective) / (tau1Effective * tau2Effective);
        const a0 = 1.0 / (tau1Effective * tau2Effective);
        const b0 = (gain * a0);

        // d^2PV/dt^2 = b0 * u - a1 * dPV/dt - a0 * (PV - PV_init)
        const d2Pv = b0 * totalPlantInput - a1 * this.pvDerivative - a0 * (this.pv - this.process.initialValue);
        this.pvDerivative += d2Pv * subDt;
        this.pv += this.pvDerivative * subDt;
      } else {
        // 1st Order FOPDT: tau1 * dPV/dt + (PV - PV_init) = K * u
        const tau = Math.max(0.01, tau1);
        const dPv = ((gain * totalPlantInput) - (this.pv - this.process.initialValue)) / tau;
        this.pv += dPv * subDt;
      }

      // Hard physical clamp on PV to prevent numerical divergence
      if (isNaN(this.pv) || !isFinite(this.pv)) {
        this.pv = pvMax * 2;
      }
    }

    // Update memory for derivative calculation
    this.lastPv = measuredPv;
    this.lastError = error;
    this.lastMv = mv;
    this.currentTime += dt;

    return {
      time: Number(this.currentTime.toFixed(3)),
      setpoint: targetSetpoint,
      pv: Number(this.pv.toFixed(3)),
      measuredPv: Number(measuredPv.toFixed(3)),
      mv: Number(mv.toFixed(3)),
      unsaturatedMv: Number(unsaturatedMv.toFixed(3)),
      error: Number(error.toFixed(3)),
      pTerm: Number(pTerm.toFixed(3)),
      iTerm: Number(iTerm.toFixed(3)),
      dTerm: Number(dTerm.toFixed(3)),
      disturbance: externalDisturbance,
    };
  }
}

/**
 * Executes a full step-response simulation from t = 0 to t = duration in <1ms.
 * Designed for immediate real-time visual feedback while tuning PID sliders.
 */
export function simulateFullResponse(
  process: ProcessModel,
  pid: PIDParameters,
  config: SimulationConfig
): SimulationDataPoint[] {
  const sim = new ProcessSimulatorState(process, pid, config);
  const totalSteps = Math.ceil(config.duration / config.dt);
  const data: SimulationDataPoint[] = [];

  for (let i = 0; i <= totalSteps; i++) {
    const t = i * config.dt;

    // Calculate current setpoint based on type
    let sp = config.initialSetpoint;
    if (t >= config.stepTime) {
      if (config.setpointType === 'step') {
        sp = config.setpoint;
      } else if (config.setpointType === 'ramp') {
        const rampSlope = (config.setpoint - config.initialSetpoint) / 5.0; // 5 second ramp
        sp = Math.min(config.setpoint, config.initialSetpoint + rampSlope * (t - config.stepTime));
      } else if (config.setpointType === 'sine') {
        const freq = config.sineFreq ?? 0.1;
        const amplitude = (config.setpoint - config.initialSetpoint);
        sp = config.initialSetpoint + amplitude * Math.sin(2 * Math.PI * freq * (t - config.stepTime));
      } else if (config.setpointType === 'square') {
        const period = 10;
        const phase = ((t - config.stepTime) % period) / period;
        sp = phase < 0.5 ? config.setpoint : config.initialSetpoint;
      }
    }

    // Calculate load disturbance
    let dist = 0;
    if (t >= config.disturbanceTime) {
      dist = config.loadDisturbance;
    }

    const pt = sim.step(sp, dist);
    data.push(pt);
  }

  return data;
}
