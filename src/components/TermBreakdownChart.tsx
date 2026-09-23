import React, { useRef, useEffect } from 'react';
import { SimulationDataPoint } from '../types/pid';
import { Layers } from 'lucide-react';

interface TermBreakdownChartProps {
  data: SimulationDataPoint[];
}

export const TermBreakdownChart: React.FC<TermBreakdownChartProps> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || data.length < 2) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    const paddingLeft = 50;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 24;

    const plotW = width - paddingLeft - paddingRight;
    const plotH = height - paddingTop - paddingBottom;

    const minT = data[0].time;
    const maxT = Math.max(minT + 1, data[data.length - 1].time);

    // Compute max/min across P, I, D
    let minVal = 0;
    let maxVal = 0;
    for (const d of data) {
      if (d.pTerm < minVal) minVal = d.pTerm;
      if (d.pTerm > maxVal) maxVal = d.pTerm;
      if (d.iTerm < minVal) minVal = d.iTerm;
      if (d.iTerm > maxVal) maxVal = d.iTerm;
      if (d.dTerm < minVal) minVal = d.dTerm;
      if (d.dTerm > maxVal) maxVal = d.dTerm;
    }

    const margin = Math.max(1, (maxVal - minVal) * 0.15);
    const effMin = minVal - margin;
    const effMax = maxVal + margin;

    const timeToX = (t: number) => paddingLeft + ((t - minT) / (maxT - minT)) * plotW;
    const valToY = (val: number) =>
      paddingTop + plotH - ((val - effMin) / (effMax - effMin)) * plotH;

    // Grid lines & Zero Axis
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#1e293b';
    ctx.fillStyle = '#64748b';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';

    // Zero reference line
    const yZero = valToY(0);
    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(paddingLeft, yZero);
    ctx.lineTo(paddingLeft + plotW, yZero);
    ctx.stroke();

    // Horizontal labels
    ctx.fillText(`${effMax.toFixed(0)}`, paddingLeft - 6, paddingTop + 8);
    ctx.fillText('0', paddingLeft - 6, yZero + 3);
    ctx.fillText(`${effMin.toFixed(0)}`, paddingLeft - 6, paddingTop + plotH);

    // Draw P-Term (Cyan)
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#06b6d4';
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = timeToX(data[i].time);
      const y = valToY(data[i].pTerm);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw I-Term (Purple)
    ctx.strokeStyle = '#a855f7';
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = timeToX(data[i].time);
      const y = valToY(data[i].iTerm);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw D-Term (Amber)
    ctx.strokeStyle = '#f59e0b';
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = timeToX(data[i].time);
      const y = valToY(data[i].dTerm);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [data]);

  return (
    <div className="flex flex-col bg-slate-900/80 rounded-xl border border-slate-800 p-4">
      {/* Header with Legend */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-200">PID 항별 기여도 분해 (P, I, D)</span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 bg-cyan-400 inline-block rounded-full" />
            <span className="text-cyan-400">P-Term (비례)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 bg-purple-400 inline-block rounded-full" />
            <span className="text-purple-400">I-Term (적분)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 bg-amber-400 inline-block rounded-full" />
            <span className="text-amber-400">D-Term (미분)</span>
          </div>
        </div>
      </div>

      <div className="relative h-28 w-full">
        <canvas ref={canvasRef} className="w-full h-full block rounded-lg" />
      </div>
    </div>
  );
};
