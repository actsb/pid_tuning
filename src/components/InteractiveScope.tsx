import React, { useRef, useEffect, useState, useMemo } from 'react';
import { SimulationDataPoint, TransientMetrics } from '../types/pid';

interface InteractiveScopeProps {
  data: SimulationDataPoint[];
  metrics?: TransientMetrics;
  unit: string;
  pvMin: number;
  pvMax: number;
  mvMin: number;
  mvMax: number;
  setpoint: number;
  stepTime?: number;
}

export const InteractiveScope: React.FC<InteractiveScopeProps> = ({
  data,
  metrics,
  unit,
  pvMin,
  pvMax,
  mvMin,
  mvMax,
  setpoint,
  stepTime = 1.0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Channel visibility states
  const [showSP, setShowSP] = useState(true);
  const [showPV, setShowPV] = useState(true);
  const [showMV, setShowMV] = useState(true);
  const [showError, setShowError] = useState(false);
  const [showEnvelope, setShowEnvelope] = useState(true);

  // Mouse hover state for crosshair
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Compute dynamic ranges for PV and MV
  const { minT, maxT, effectivePvMin, effectivePvMax } = useMemo(() => {
    if (!data || data.length === 0) {
      return { minT: 0, maxT: 50, effectivePvMin: pvMin, effectivePvMax: pvMax };
    }
    const minT = data[0].time;
    const maxT = Math.max(minT + 1, data[data.length - 1].time);

    let actualMinPv = Infinity;
    let actualMaxPv = -Infinity;

    for (const d of data) {
      if (d.pv < actualMinPv) actualMinPv = d.pv;
      if (d.pv > actualMaxPv) actualMaxPv = d.pv;
      if (d.setpoint < actualMinPv) actualMinPv = d.setpoint;
      if (d.setpoint > actualMaxPv) actualMaxPv = d.setpoint;
    }

    const margin = Math.max(1, (actualMaxPv - actualMinPv) * 0.15);
    const effMin = Math.min(pvMin, actualMinPv - margin);
    const effMax = Math.max(pvMax, actualMaxPv + margin);

    return { minT, maxT, effectivePvMin: effMin, effectivePvMax: effMax };
  }, [data, pvMin, pvMax]);

  // Main Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-DPI retina display
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear background
    ctx.fillStyle = '#090d16'; // Deep space obsidian
    ctx.fillRect(0, 0, width, height);

    if (!data || data.length < 2) {
      ctx.fillStyle = '#64748b';
      ctx.font = '13px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('시뮬레이션 데이터 수신 중...', width / 2, height / 2);
      return;
    }

    // Split layout: Upper 65% for PV/SP, Lower 35% for MV/Control Effort
    const paddingLeft = 60;
    const paddingRight = 40;
    const paddingTop = 24;
    const paddingBottom = 28;
    const splitGap = 20;

    const availableH = height - paddingTop - paddingBottom - splitGap;
    const upperH = availableH * 0.65;
    const lowerH = availableH * 0.35;

    const upperY = paddingTop;
    const lowerY = paddingTop + upperH + splitGap;

    const plotW = width - paddingLeft - paddingRight;

    const timeToX = (t: number) => paddingLeft + ((t - minT) / (maxT - minT)) * plotW;
    const pvToY = (val: number) =>
      upperY + upperH - ((val - effectivePvMin) / (effectivePvMax - effectivePvMin)) * upperH;
    const mvToY = (val: number) =>
      lowerY + lowerH - ((val - mvMin) / (mvMax - mvMin)) * lowerH;

    // 1. Grid Lines & Axis Labels (Upper Plot)
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#1e293b';
    ctx.fillStyle = '#64748b';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';

    // Horizontal grid lines for PV
    const pvTicks = 5;
    for (let i = 0; i <= pvTicks; i++) {
      const frac = i / pvTicks;
      const val = effectivePvMin + frac * (effectivePvMax - effectivePvMin);
      const y = upperY + upperH - frac * upperH;

      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(paddingLeft + plotW, y);
      ctx.stroke();

      ctx.fillText(`${val.toFixed(1)} ${unit}`, paddingLeft - 8, y + 3);
    }

    // Horizontal grid lines for MV (Lower Plot)
    const mvTicks = 3;
    for (let i = 0; i <= mvTicks; i++) {
      const frac = i / mvTicks;
      const val = mvMin + frac * (mvMax - mvMin);
      const y = lowerY + lowerH - frac * lowerH;

      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(paddingLeft + plotW, y);
      ctx.stroke();

      ctx.fillText(`${val.toFixed(0)}%`, paddingLeft - 8, y + 3);
    }

    // Vertical time grid lines
    ctx.textAlign = 'center';
    const timeStep = (maxT - minT) > 30 ? 10 : 5;
    const startTick = Math.ceil(minT / timeStep) * timeStep;

    for (let t = startTick; t <= maxT; t += timeStep) {
      const x = timeToX(t);
      ctx.beginPath();
      ctx.moveTo(x, upperY);
      ctx.lineTo(x, upperY + upperH);
      ctx.moveTo(x, lowerY);
      ctx.lineTo(x, lowerY + lowerH);
      ctx.stroke();

      ctx.fillText(`${t.toFixed(0)}s`, x, lowerY + lowerH + 16);
    }

    // Section Titles
    ctx.textAlign = 'left';
    ctx.font = '11px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`공정 변수 (PV) 및 목표값 (SP) [${unit}]`, paddingLeft + 8, upperY + 14);
    ctx.fillText(`조작량 (MV / 제어기 출력) [%]`, paddingLeft + 8, lowerY + 14);

    // 2. Tolerance Envelope (±2% Settling band around Setpoint)
    if (showEnvelope && setpoint !== undefined) {
      const tol = Math.max(0.2, Math.abs(setpoint) * 0.02);
      const yHigh = pvToY(setpoint + tol);
      const yLow = pvToY(setpoint - tol);

      ctx.fillStyle = 'rgba(6, 182, 212, 0.04)';
      ctx.fillRect(paddingLeft, yHigh, plotW, yLow - yHigh);

      ctx.setLineDash([2, 4]);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
      ctx.beginPath();
      ctx.moveTo(paddingLeft, yHigh);
      ctx.lineTo(paddingLeft + plotW, yHigh);
      ctx.moveTo(paddingLeft, yLow);
      ctx.lineTo(paddingLeft + plotW, yLow);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 3. Transient Metrics Visual Annotations (Rise Time & Peak Overshoot)
    if (metrics && metrics.isStable) {
      // Rise time band
      if (metrics.riseTime && metrics.riseTime > 0) {
        const xStart = timeToX(stepTime);
        const xEnd = timeToX(stepTime + metrics.riseTime);
        if (xEnd <= paddingLeft + plotW) {
          ctx.fillStyle = 'rgba(245, 158, 11, 0.06)';
          ctx.fillRect(xStart, upperY, xEnd - xStart, upperH);

          ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(xEnd, upperY);
          ctx.lineTo(xEnd, upperY + upperH);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Settling time vertical line
      if (metrics.settlingTime && metrics.settlingTime > 0) {
        const xSettled = timeToX(stepTime + metrics.settlingTime);
        if (xSettled <= paddingLeft + plotW) {
          ctx.strokeStyle = '#10b981';
          ctx.setLineDash([4, 4]);
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(xSettled, upperY);
          ctx.lineTo(xSettled, upperY + upperH);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#10b981';
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.textAlign = 'right';
          ctx.fillText(`정착 Ts: ${metrics.settlingTime}s`, xSettled - 4, upperY + 28);
        }
      }

      // Peak Overshoot marker
      if (metrics.overshootPercent > 0.5 && metrics.peakTime !== null) {
        const xPeak = timeToX(stepTime + metrics.peakTime);
        const yPeak = pvToY(metrics.peakValue);
        if (xPeak <= paddingLeft + plotW) {
          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.arc(xPeak, yPeak, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fda4af';
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`+${metrics.overshootPercent}%`, xPeak, yPeak - 8);
        }
      }
    }

    // 4. Draw Setpoint (SP) Trace
    if (showSP) {
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#f59e0b'; // Amber gold
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      for (let i = 0; i < data.length; i++) {
        const x = timeToX(data[i].time);
        const y = pvToY(data[i].setpoint);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 5. Draw Process Variable (PV) Trace
    if (showPV) {
      // Glow effect
      ctx.shadowColor = 'rgba(6, 182, 212, 0.4)';
      ctx.shadowBlur = 6;
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = '#06b6d4'; // Laser cyan
      ctx.beginPath();
      for (let i = 0; i < data.length; i++) {
        const x = timeToX(data[i].time);
        const y = pvToY(data[i].pv);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset shadow
    }

    // 6. Draw Error Trace if enabled
    if (showError) {
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.8)';
      ctx.beginPath();
      for (let i = 0; i < data.length; i++) {
        const x = timeToX(data[i].time);
        const y = pvToY(data[i].error);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // 7. Draw Manipulated Variable (MV / Output) Trace in Lower Plot
    if (showMV) {
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = '#10b981'; // Emerald
      ctx.beginPath();
      for (let i = 0; i < data.length; i++) {
        const x = timeToX(data[i].time);
        const y = mvToY(data[i].mv);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // 8. Interactive Crosshair Hover Inspector
    if (hoverIndex !== null && hoverIndex >= 0 && hoverIndex < data.length && mousePos) {
      const pt = data[hoverIndex];
      const x = timeToX(pt.time);

      // Vertical crosshair hairline
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(x, upperY);
      ctx.lineTo(x, lowerY + lowerH);
      ctx.stroke();
      ctx.setLineDash([]);

      // Circle highlights on the curves
      const ySP = pvToY(pt.setpoint);
      const yPV = pvToY(pt.pv);
      const yMV = mvToY(pt.mv);

      // SP dot
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(x, ySP, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // PV dot
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(x, yPV, 4, 0, Math.PI * 2);
      ctx.fill();

      // MV dot
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(x, yMV, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [
    data,
    metrics,
    minT,
    maxT,
    effectivePvMin,
    effectivePvMax,
    pvMin,
    pvMax,
    mvMin,
    mvMax,
    unit,
    setpoint,
    stepTime,
    showSP,
    showPV,
    showMV,
    showError,
    showEnvelope,
    hoverIndex,
    mousePos,
  ]);

  // Handle Mouse movement for probe HUD
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !data || data.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y });

    const paddingLeft = 60;
    const paddingRight = 40;
    const plotW = rect.width - paddingLeft - paddingRight;

    if (x < paddingLeft || x > paddingLeft + plotW) {
      setHoverIndex(null);
      return;
    }

    const tFrac = (x - paddingLeft) / plotW;
    const targetT = minT + tFrac * (maxT - minT);

    // Find nearest point
    let closestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < data.length; i++) {
      const diff = Math.abs(data[i].time - targetT);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }

    setHoverIndex(closestIdx);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
    setMousePos(null);
  };

  const activePoint = hoverIndex !== null && data[hoverIndex] ? data[hoverIndex] : data[data.length - 1];

  return (
    <div ref={containerRef} className="relative flex flex-col h-full bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
      {/* Top Channel Legend & Toggles */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-4">
          {/* SP Toggle */}
          <button
            onClick={() => setShowSP(!showSP)}
            className={`flex items-center gap-1.5 transition-opacity ${
              showSP ? 'opacity-100 font-semibold' : 'opacity-40'
            }`}
          >
            <span className="w-3 h-0.5 border-t-2 border-dashed border-amber-500 inline-block" />
            <span className="text-amber-400">목표값 (SP)</span>
          </button>

          {/* PV Toggle */}
          <button
            onClick={() => setShowPV(!showPV)}
            className={`flex items-center gap-1.5 transition-opacity ${
              showPV ? 'opacity-100 font-semibold' : 'opacity-40'
            }`}
          >
            <span className="w-3 h-0.5 bg-cyan-400 inline-block rounded-full" />
            <span className="text-cyan-400">공정값 (PV)</span>
          </button>

          {/* MV Toggle */}
          <button
            onClick={() => setShowMV(!showMV)}
            className={`flex items-center gap-1.5 transition-opacity ${
              showMV ? 'opacity-100 font-semibold' : 'opacity-40'
            }`}
          >
            <span className="w-3 h-0.5 bg-emerald-400 inline-block rounded-full" />
            <span className="text-emerald-400">제어 출력 (MV)</span>
          </button>

          {/* Error Toggle */}
          <button
            onClick={() => setShowError(!showError)}
            className={`flex items-center gap-1.5 transition-opacity ${
              showError ? 'opacity-100 font-semibold' : 'opacity-40'
            }`}
          >
            <span className="w-3 h-0.5 bg-rose-400 inline-block rounded-full" />
            <span className="text-rose-400">편차 (Error)</span>
          </button>

          {/* Envelope Toggle */}
          <button
            onClick={() => setShowEnvelope(!showEnvelope)}
            className={`hidden sm:flex items-center gap-1.5 transition-opacity ${
              showEnvelope ? 'opacity-100 font-semibold' : 'opacity-40'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500/20 border border-cyan-500/40 inline-block" />
            <span className="text-slate-400">±2% 정착 허용대</span>
          </button>
        </div>

        {/* Live Monospace Value Readout HUD */}
        {activePoint && (
          <div className="flex items-center gap-3 font-mono text-[11px] tabular-nums text-slate-300">
            <div>
              <span className="text-slate-500">t:</span>{' '}
              <span className="font-semibold text-white">{activePoint.time.toFixed(1)}s</span>
            </div>
            <div>
              <span className="text-amber-500">SP:</span>{' '}
              <span className="font-semibold text-amber-300">{activePoint.setpoint.toFixed(1)}</span>
            </div>
            <div>
              <span className="text-cyan-500">PV:</span>{' '}
              <span className="font-semibold text-cyan-300">{activePoint.pv.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-emerald-500">MV:</span>{' '}
              <span className="font-semibold text-emerald-300">{activePoint.mv.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-rose-500">e:</span>{' '}
              <span className="font-semibold text-rose-300">{activePoint.error.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Canvas Viewport */}
      <div className="relative flex-1 min-h-[360px] w-full">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full block cursor-crosshair"
        />
      </div>
    </div>
  );
};
