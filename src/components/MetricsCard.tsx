import React from 'react';
import { TransientMetrics } from '../types/pid';
import { BarChart3, CheckCircle, AlertTriangle, XCircle, Clock, TrendingUp } from 'lucide-react';

interface MetricsCardProps {
  metrics: TransientMetrics;
  unit: string;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({ metrics, unit }) => {
  const getStatusBadge = () => {
    if (!metrics.isStable) {
      return (
        <div className="flex items-center gap-1.5 text-rose-400 font-semibold text-xs">
          <XCircle className="w-4 h-4" />
          <span>{metrics.statusText}</span>
        </div>
      );
    }
    if (metrics.statusText.includes('진동')) {
      return (
        <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-xs">
          <AlertTriangle className="w-4 h-4" />
          <span>{metrics.statusText}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
        <CheckCircle className="w-4 h-4" />
        <span>{metrics.statusText}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3 bg-slate-900/80 rounded-xl border border-slate-800 p-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-200">실시간 과도응답 및 성능 지표</span>
        </div>
        {getStatusBadge()}
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* Overshoot Mp */}
        <div className="flex flex-col p-2.5 bg-slate-950/70 rounded-lg border border-slate-800/80">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">최대 오버슈트 (Mp)</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span
              className={`text-xl font-bold font-mono tabular-nums ${
                metrics.overshootPercent > 30
                  ? 'text-rose-400'
                  : metrics.overshootPercent > 10
                  ? 'text-amber-300'
                  : 'text-emerald-400'
              }`}
            >
              {metrics.overshootPercent.toFixed(1)}
            </span>
            <span className="text-[10px] font-mono text-slate-500">%</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">
            피크: {metrics.peakValue} {unit}
          </span>
        </div>

        {/* Rise Time tr */}
        <div className="flex flex-col p-2.5 bg-slate-950/70 rounded-lg border border-slate-800/80">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">상승 시간 (tr)</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono tabular-nums text-slate-100">
              {metrics.riseTime !== null ? metrics.riseTime.toFixed(2) : '--'}
            </span>
            <span className="text-[10px] font-mono text-slate-500">sec</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">10% → 90% 도달</span>
        </div>

        {/* Settling Time ts */}
        <div className="flex flex-col p-2.5 bg-slate-950/70 rounded-lg border border-slate-800/80">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">정착 시간 (ts, ±2%)</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span
              className={`text-xl font-bold font-mono tabular-nums ${
                metrics.settlingTime !== null ? 'text-cyan-400' : 'text-slate-500'
              }`}
            >
              {metrics.settlingTime !== null ? metrics.settlingTime.toFixed(2) : '미정착'}
            </span>
            {metrics.settlingTime !== null && (
              <span className="text-[10px] font-mono text-slate-500">sec</span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">±2% 오차대 진입</span>
        </div>

        {/* Steady-State Error ess */}
        <div className="flex flex-col p-2.5 bg-slate-950/70 rounded-lg border border-slate-800/80">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">정상상태 오차 (ess)</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span
              className={`text-xl font-bold font-mono tabular-nums ${
                Math.abs(metrics.steadyStateError) < 0.1 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {metrics.steadyStateError.toFixed(2)}
            </span>
            <span className="text-[10px] font-mono text-slate-500">{unit}</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">SP - 최종 PV</span>
        </div>

        {/* ITAE Performance Index */}
        <div className="flex flex-col p-2.5 bg-slate-950/70 rounded-lg border border-slate-800/80">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">ITAE 적분 지수</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono tabular-nums text-purple-300">
              {metrics.itae.toFixed(1)}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">∫ t·|e(t)| dt (작을수록 우수)</span>
        </div>

        {/* IAE Performance Index */}
        <div className="flex flex-col p-2.5 bg-slate-950/70 rounded-lg border border-slate-800/80">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">IAE 절대 오차</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono tabular-nums text-slate-300">
              {metrics.iae.toFixed(1)}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">∫ |e(t)| dt</span>
        </div>
      </div>
    </div>
  );
};
