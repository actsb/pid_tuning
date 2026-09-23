import { AutoTuningResult, ProcessModel } from '../types/pid';

/**
 * Calculates auto-tuning PID parameters based on standard industrial methods
 * using process Gain (K), Time Constant (tau), and Dead Time (theta).
 */
export function calculateAutoTuning(process: ProcessModel): AutoTuningResult[] {
  const K = Math.max(0.0001, process.gain);
  // For 2nd order, effective tau can be approximated as tau1 + tau2 or dominant pole
  const tau = process.order === 2 ? Math.max(0.1, process.tau1 + process.tau2 * 0.5) : Math.max(0.1, process.tau1);
  const theta = Math.max(0.05, process.deadTime);

  const results: AutoTuningResult[] = [];

  // 1. Ziegler-Nichols (Z-N) Open-Loop Step Response Method
  // Kp = 1.2 * tau / (K * theta)
  // Ti = 2.0 * theta  => Ki = Kp / Ti
  // Td = 0.5 * theta  => Kd = Kp * Td
  {
    const kp_zn = (1.2 * tau) / (K * theta);
    const ti_zn = 2.0 * theta;
    const td_zn = 0.5 * theta;
    const ki_zn = kp_zn / ti_zn;
    const kd_zn = kp_zn * td_zn;

    results.push({
      methodName: 'Ziegler-Nichols (Z-N)',
      koreanName: '지글러-니콜스 (Z-N)',
      description: '가장 대표적인 고전 튜닝법. 빠른 응답을 얻지만 약 25%의 오버슈트(진동)가 발생할 수 있습니다.',
      kp: Number(kp_zn.toFixed(3)),
      ki: Number(ki_zn.toFixed(3)),
      kd: Number(kd_zn.toFixed(3)),
      ti: Number(ti_zn.toFixed(2)),
      td: Number(td_zn.toFixed(2)),
    });
  }

  // 2. Cohen-Coon Method (Better for systems with significant dead time)
  // Kp = (tau / (K * theta)) * (4/3 + theta / (4 * tau))
  // Ti = theta * (32 + 6 * theta / tau) / (13 + 8 * theta / tau)
  // Td = theta * 4 / (11 + 2 * theta / tau)
  {
    const r = theta / tau;
    const kp_cc = (tau / (K * theta)) * (1.333 + 0.25 * r);
    const ti_cc = theta * ((32 + 6 * r) / (13 + 8 * r));
    const td_cc = theta * (4 / (11 + 2 * r));
    const ki_cc = kp_cc / ti_cc;
    const kd_cc = kp_cc * td_cc;

    results.push({
      methodName: 'Cohen-Coon',
      koreanName: '코헨-쿤 (Cohen-Coon)',
      description: '지연시간(Dead Time)이 비교적 긴 공정에 적합하며 정밀한 모델 파라미터를 반영합니다.',
      kp: Number(kp_cc.toFixed(3)),
      ki: Number(ki_cc.toFixed(3)),
      kd: Number(kd_cc.toFixed(3)),
      ti: Number(ti_cc.toFixed(2)),
      td: Number(td_cc.toFixed(2)),
    });
  }

  // 3. Chien-Hrones-Reswick (CHR - 0% Overshoot Setpoint Tracking)
  // Kp = 0.6 * tau / (K * theta)
  // Ti = 1.0 * tau
  // Td = 0.5 * theta
  {
    const kp_chr = (0.6 * tau) / (K * theta);
    const ti_chr = tau;
    const td_chr = 0.5 * theta;
    const ki_chr = kp_chr / ti_chr;
    const kd_chr = kp_chr * td_chr;

    results.push({
      methodName: 'CHR (0% Overshoot)',
      koreanName: 'CHR 무오버슈트 (CHR 0%)',
      description: '오버슈트를 엄격하게 0%로 억제하여 설비 손상이나 넘침을 방지하는 안전 지향 튜닝입니다.',
      kp: Number(kp_chr.toFixed(3)),
      ki: Number(ki_chr.toFixed(3)),
      kd: Number(kd_chr.toFixed(3)),
      ti: Number(ti_chr.toFixed(2)),
      td: Number(td_chr.toFixed(2)),
    });
  }

  // 4. Chien-Hrones-Reswick (CHR - 20% Overshoot Setpoint Tracking)
  // Kp = 0.95 * tau / (K * theta)
  // Ti = 1.35 * tau
  // Td = 0.47 * theta
  {
    const kp_chr20 = (0.95 * tau) / (K * theta);
    const ti_chr20 = 1.35 * tau;
    const td_chr20 = 0.47 * theta;
    const ki_chr20 = kp_chr20 / ti_chr20;
    const kd_chr20 = kp_chr20 * td_chr20;

    results.push({
      methodName: 'CHR (20% Overshoot)',
      koreanName: 'CHR 20% 오버슈트 (빠른 추종)',
      description: '적절한 오버슈트를 허용하면서 빠른 정착 시간과 목표값 추종 성능을 제공합니다.',
      kp: Number(kp_chr20.toFixed(3)),
      ki: Number(ki_chr20.toFixed(3)),
      kd: Number(kd_chr20.toFixed(3)),
      ti: Number(ti_chr20.toFixed(2)),
      td: Number(td_chr20.toFixed(2)),
    });
  }

  // 5. Tyreus-Luyben (Conservative Industrial Tuning)
  // Often used in chemical processes to avoid aggressive oscillations
  {
    // Conservative formula
    const kp_tl = (0.45 * tau) / (K * theta);
    const ti_tl = 2.2 * theta + 1.2 * tau;
    const td_tl = 0.3 * theta;
    const ki_tl = kp_tl / ti_tl;
    const kd_tl = kp_tl * td_tl;

    results.push({
      methodName: 'Tyreus-Luyben',
      koreanName: '타이리어스-루이벤 (보수적 제어)',
      description: '제어 밸브와 액추에이터의 피로를 최소화하며 진동 없이 완만하게 수렴하도록 합니다.',
      kp: Number(kp_tl.toFixed(3)),
      ki: Number(ki_tl.toFixed(3)),
      kd: Number(kd_tl.toFixed(3)),
      ti: Number(ti_tl.toFixed(2)),
      td: Number(td_tl.toFixed(2)),
    });
  }

  return results;
}
