import { SimulationDataPoint, TransientMetrics } from '../types/pid';

export function calculateMetrics(
  history: SimulationDataPoint[],
  stepTime: number,
  targetSetpoint: number,
  initialPV: number
): TransientMetrics {
  if (!history || history.length === 0) {
    return {
      riseTime: null,
      settlingTime: null,
      peakValue: 0,
      peakTime: null,
      overshootPercent: 0,
      steadyStateError: 0,
      iae: 0,
      ise: 0,
      itae: 0,
      isStable: true,
      statusText: '초기화 대기중',
    };
  }

  const deltaSP = targetSetpoint - initialPV;
  const isPositiveStep = deltaSP >= 0;

  // Filter points after stepTime
  const postStepPoints = history.filter((p) => p.time >= stepTime);
  if (postStepPoints.length === 0) {
    return {
      riseTime: null,
      settlingTime: null,
      peakValue: initialPV,
      peakTime: null,
      overshootPercent: 0,
      steadyStateError: targetSetpoint - initialPV,
      iae: 0,
      ise: 0,
      itae: 0,
      isStable: true,
      statusText: '정상',
    };
  }

  let iae = 0;
  let ise = 0;
  let itae = 0;
  let maxAbsPV = -Infinity;
  let peakVal = initialPV;
  let peakTime: number | null = null;

  for (let i = 0; i < postStepPoints.length; i++) {
    const pt = postStepPoints[i];
    const prevPt = i > 0 ? postStepPoints[i - 1] : postStepPoints[0];
    const dt = Math.max(0.001, pt.time - prevPt.time);
    const err = Math.abs(pt.error);

    iae += err * dt;
    ise += err * err * dt;
    itae += (pt.time - stepTime) * err * dt;

    if (Math.abs(pt.pv) > maxAbsPV) {
      maxAbsPV = Math.abs(pt.pv);
    }

    if (isPositiveStep) {
      if (pt.pv > peakVal) {
        peakVal = pt.pv;
        peakTime = pt.time;
      }
    } else {
      if (pt.pv < peakVal) {
        peakVal = pt.pv;
        peakTime = pt.time;
      }
    }
  }

  // Stability check: if PV explodes to Infinity, NaN, or exceeds 10x range
  const lastPoints = postStepPoints.slice(-15);
  const lastPV = lastPoints[lastPoints.length - 1]?.pv ?? initialPV;
  const finalError = targetSetpoint - lastPV;

  let isStable = true;
  let isOscillating = false;
  let statusText = '안정 (Stable)';

  if (isNaN(lastPV) || !isFinite(lastPV) || Math.abs(lastPV) > 1e6) {
    isStable = false;
    statusText = '발산 / 불안정 (Unstable)';
  } else {
    // Check oscillation in the tail
    let signChanges = 0;
    for (let i = 1; i < lastPoints.length; i++) {
      const d1 = lastPoints[i].pv - lastPoints[i - 1].pv;
      const d0 = i > 1 ? lastPoints[i - 1].pv - lastPoints[i - 2].pv : 0;
      if (d1 * d0 < 0 && Math.abs(d1) > 0.05) {
        signChanges++;
      }
    }

    if (signChanges >= 3) {
      isOscillating = true;
      statusText = '지속 진동 (Oscillating)';
    } else if (Math.abs(finalError) > Math.abs(deltaSP) * 0.1 && Math.abs(finalError) > 0.5) {
      statusText = '잔류 편차 발생 (Offset)';
    } else {
      statusText = '안정 수렴 (Converged)';
    }
  }

  // Overshoot calculation
  let overshootPercent = 0;
  if (Math.abs(deltaSP) > 1e-4) {
    if (isPositiveStep) {
      if (peakVal > targetSetpoint) {
        overshootPercent = Math.max(0, ((peakVal - targetSetpoint) / Math.abs(deltaSP)) * 100);
      }
    } else {
      if (peakVal < targetSetpoint) {
        overshootPercent = Math.max(0, ((targetSetpoint - peakVal) / Math.abs(deltaSP)) * 100);
      }
    }
  }

  // Rise Time: 10% to 90% of step change
  let t10: number | null = null;
  let t90: number | null = null;
  const val10 = initialPV + 0.1 * deltaSP;
  const val90 = initialPV + 0.9 * deltaSP;

  for (const pt of postStepPoints) {
    if (t10 === null) {
      if ((isPositiveStep && pt.pv >= val10) || (!isPositiveStep && pt.pv <= val10)) {
        t10 = pt.time;
      }
    }
    if (t90 === null) {
      if ((isPositiveStep && pt.pv >= val90) || (!isPositiveStep && pt.pv <= val90)) {
        t90 = pt.time;
      }
    }
  }

  const riseTime = t10 !== null && t90 !== null && t90 >= t10 ? Number((t90 - t10).toFixed(2)) : null;

  // Settling Time: 2% band of deltaSP around targetSetpoint
  const tolerance = Math.max(0.05, Math.abs(deltaSP) * 0.02);
  let settlingTime: number | null = null;

  // Search from end backward to find when error entered and never left the 2% band
  let brokeBandIndex = -1;
  for (let i = postStepPoints.length - 1; i >= 0; i--) {
    const pt = postStepPoints[i];
    if (Math.abs(pt.pv - targetSetpoint) > tolerance) {
      brokeBandIndex = i;
      break;
    }
  }

  if (brokeBandIndex === -1 && postStepPoints.length > 0) {
    // Settled immediately
    settlingTime = 0;
  } else if (brokeBandIndex < postStepPoints.length - 1) {
    const settledPoint = postStepPoints[brokeBandIndex + 1];
    settlingTime = Number((settledPoint.time - stepTime).toFixed(2));
  } else {
    // Never settled within simulation window
    settlingTime = null;
  }

  return {
    riseTime,
    settlingTime,
    peakValue: Number(peakVal.toFixed(2)),
    peakTime: peakTime !== null ? Number((peakTime - stepTime).toFixed(2)) : null,
    overshootPercent: Number(overshootPercent.toFixed(1)),
    steadyStateError: Number(finalError.toFixed(2)),
    iae: Number(iae.toFixed(2)),
    ise: Number(ise.toFixed(2)),
    itae: Number(itae.toFixed(2)),
    isStable,
    statusText,
  };
}
