import React from 'react';
import { ProcessModel } from '../types/pid';
import { Flame, Droplet, Gauge, Cpu, ArrowRight } from 'lucide-react';

interface PhysicalDiagramProps {
  process: ProcessModel;
  pv: number;
  setpoint: number;
  mv: number;
}

export const PhysicalDiagram: React.FC<PhysicalDiagramProps> = ({
  process,
  pv,
  setpoint,
  mv,
}) => {
  const { type, unit, pvMin, pvMax } = process;

  // Percentage of PV in range
  const pvPct = Math.min(100, Math.max(0, ((pv - pvMin) / (pvMax - pvMin)) * 100));
  const spPct = Math.min(100, Math.max(0, ((setpoint - pvMin) / (pvMax - pvMin)) * 100));
  const mvPct = Math.min(100, Math.max(0, mv));

  if (type === 'thermal') {
    // Thermal Furnace / Heat Exchanger
    const heatGlowColor = `rgba(239, 68, 68, ${Math.min(1, Math.max(0.1, mvPct / 100))})`;
    return (
      <div className="flex flex-col h-full bg-slate-900/60 rounded-xl border border-slate-800 p-4 justify-between">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-semibold text-slate-200">산업용 전열 가열로 상태</span>
          </div>
          <span className="font-mono text-xs text-cyan-400 font-semibold">{pv.toFixed(1)} {unit}</span>
        </div>

        {/* Furnace Chamber Visual */}
        <div className="relative my-3 h-40 bg-slate-950/80 rounded-lg border border-slate-700/60 p-3 flex items-center justify-between overflow-hidden">
          {/* Internal Chamber glow */}
          <div
            className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at center, ${heatGlowColor} 0%, rgba(15,23,42,0) 75%)`,
              opacity: mvPct / 100,
            }}
          />

          {/* Heater Coil Element */}
          <div className="z-10 flex flex-col items-center">
            <div
              className="w-16 h-24 border-2 rounded-lg flex flex-col justify-around py-1 px-2 transition-colors duration-300"
              style={{
                borderColor: mvPct > 10 ? '#ef4444' : '#475569',
                boxShadow: mvPct > 10 ? `0 0 16px rgba(239,68,68,${mvPct / 100})` : 'none',
              }}
            >
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-1 rounded transition-colors duration-300"
                  style={{
                    backgroundColor: mvPct > 10 ? '#f97316' : '#334155',
                  }}
                />
              ))}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 font-mono">히터: {mvPct.toFixed(0)}%</span>
          </div>

          {/* Air circulation & convection */}
          <div className="z-10 flex-1 flex flex-col items-center justify-center px-4">
            <div className="text-center">
              <span className="text-xs font-mono text-slate-400 block">온도 변화율</span>
              <span className="text-sm font-semibold font-mono text-cyan-400">
                {pv > setpoint ? '냉각 중' : '가열 중'}
              </span>
            </div>
            <div className="flex gap-1.5 mt-2">
              <div
                className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-ping"
                style={{ animationDuration: `${Math.max(0.4, 2 - (mvPct / 50))}s` }}
              />
              <div
                className="w-1.5 h-1.5 rounded-full bg-cyan-400"
              />
            </div>
          </div>

          {/* Thermometer Column */}
          <div className="z-10 flex items-center gap-2">
            <div className="relative w-4 h-28 bg-slate-900 rounded-full border border-slate-700 overflow-hidden flex flex-col justify-end p-0.5">
              {/* Target SP indicator line */}
              <div
                className="absolute w-full h-0.5 bg-amber-400 left-0 z-20"
                style={{ bottom: `${spPct}%` }}
                title={`목표 온도 SP: ${setpoint}°C`}
              />
              {/* Mercury column */}
              <div
                className="w-full bg-gradient-to-t from-cyan-500 to-rose-500 rounded-full transition-all duration-150"
                style={{ height: `${pvPct}%` }}
              />
            </div>
            <div className="flex flex-col text-[10px] font-mono text-slate-400 justify-between h-28">
              <span>{pvMax}°C</span>
              <span className="text-amber-400 font-semibold">{setpoint}°C</span>
              <span>{pvMin}°C</span>
            </div>
          </div>
        </div>

        {/* Heat Flow Metadata */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="bg-slate-950/60 p-2 rounded border border-slate-800/80">
            <span className="text-slate-500 block text-[10px]">입력 발열량</span>
            <span className="text-emerald-400 font-semibold">{(mv * 1.5).toFixed(1)} kW</span>
          </div>
          <div className="bg-slate-950/60 p-2 rounded border border-slate-800/80">
            <span className="text-slate-500 block text-[10px]">외기 자연 손실</span>
            <span className="text-slate-300 font-semibold">{((pv - 20) * 0.05).toFixed(1)} kW</span>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'level') {
    // Liquid Level Buffer Tank
    return (
      <div className="flex flex-col h-full bg-slate-900/60 rounded-xl border border-slate-800 p-4 justify-between">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Droplet className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-slate-200">수위 조절 탱크 상태</span>
          </div>
          <span className="font-mono text-xs text-cyan-400 font-semibold">{pv.toFixed(1)} {unit}</span>
        </div>

        {/* Tank & Piping Visual */}
        <div className="relative my-3 h-40 bg-slate-950/80 rounded-lg border border-slate-700/60 p-3 flex items-center justify-between">
          {/* Inlet Pipe & Valve */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-mono mb-1">유입 밸브</span>
            <div className="w-6 h-10 border-2 border-slate-600 rounded bg-slate-900 flex items-center justify-center">
              <div
                className="w-4 bg-emerald-500 rounded-sm transition-all"
                style={{ height: `${Math.max(2, mvPct * 0.35)}px` }}
              />
            </div>
            <span className="text-[10px] text-emerald-400 font-mono mt-1">{mvPct.toFixed(0)}%</span>
          </div>

          {/* Water Stream */}
          <div className="flex-1 flex justify-center">
            <div
              className="w-1.5 bg-cyan-400/80 rounded-full transition-opacity"
              style={{
                height: '70px',
                opacity: mvPct > 2 ? Math.min(1, mvPct / 40) : 0.05,
              }}
            />
          </div>

          {/* Main Water Tank Vessel */}
          <div className="relative w-32 h-32 border-2 border-t-0 border-slate-600 rounded-b-xl bg-slate-900/90 overflow-hidden flex flex-col justify-end">
            {/* Setpoint Line */}
            <div
              className="absolute w-full h-0.5 border-t border-dashed border-amber-400 z-20 left-0"
              style={{ bottom: `${spPct}%` }}
              title={`목표 수위: ${setpoint}%`}
            />

            {/* Liquid Mass */}
            <div
              className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 transition-all duration-150 relative overflow-hidden"
              style={{ height: `${pvPct}%` }}
            >
              {/* Liquid surface wave ripple */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-cyan-200/50 animate-pulse" />
            </div>

            {/* Height Percentage Marker */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-xs font-mono font-bold text-white drop-shadow">
                {pv.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Flow Metadata */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="bg-slate-950/60 p-2 rounded border border-slate-800/80">
            <span className="text-slate-500 block text-[10px]">유입 유량 (Qin)</span>
            <span className="text-emerald-400 font-semibold">{(mv * 0.8).toFixed(1)} L/s</span>
          </div>
          <div className="bg-slate-950/60 p-2 rounded border border-slate-800/80">
            <span className="text-slate-500 block text-[10px]">자연 배출 (Qout)</span>
            <span className="text-slate-300 font-semibold">{(pv * 0.75).toFixed(1)} L/s</span>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'motor') {
    // DC Servo Motor
    const spinSpeedSec = pv > 10 ? Math.max(0.1, 1000 / Math.max(1, pv)) : 0;
    return (
      <div className="flex flex-col h-full bg-slate-900/60 rounded-xl border border-slate-800 p-4 justify-between">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-slate-200">DC 서보 모터 회전 상태</span>
          </div>
          <span className="font-mono text-xs text-cyan-400 font-semibold">{pv.toFixed(0)} {unit}</span>
        </div>

        {/* Motor Rotor Visual */}
        <div className="relative my-3 h-40 bg-slate-950/80 rounded-lg border border-slate-700/60 p-3 flex items-center justify-around">
          {/* Rotating Rotor Disc */}
          <div className="relative w-28 h-28 rounded-full border-4 border-slate-700 bg-slate-900 flex items-center justify-center">
            {/* Rotor Crosshairs that rotate */}
            <div
              className="absolute inset-2 rounded-full border border-dashed border-cyan-500/60 flex items-center justify-center"
              style={{
                animation: spinSpeedSec > 0 ? `spin ${spinSpeedSec}s linear infinite` : 'none',
              }}
            >
              <div className="w-full h-0.5 bg-cyan-400" />
              <div className="h-full w-0.5 bg-cyan-400 absolute" />
            </div>
            {/* Center Bearing */}
            <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-500 z-10 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            </div>
          </div>

          {/* RPM & PWM Indicator */}
          <div className="flex flex-col gap-2">
            <div>
              <span className="text-[10px] text-slate-400 font-mono block">인가 전압 PWM</span>
              <span className="text-sm font-semibold text-emerald-400 font-mono">{mv.toFixed(1)} %</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-mono block">목표 속도 SP</span>
              <span className="text-sm font-semibold text-amber-400 font-mono">{setpoint} RPM</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="bg-slate-950/60 p-2 rounded border border-slate-800/80">
            <span className="text-slate-500 block text-[10px]">출력 토크</span>
            <span className="text-emerald-400 font-semibold">{(mv * 0.12).toFixed(2)} N·m</span>
          </div>
          <div className="bg-slate-950/60 p-2 rounded border border-slate-800/80">
            <span className="text-slate-500 block text-[10px]">기계적 부하</span>
            <span className="text-slate-300 font-semibold">0.45 N·m</span>
          </div>
        </div>
      </div>
    );
  }

  // Fallback: Gas Pressure / Custom Universal Block Diagram
  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-xl border border-slate-800 p-4 justify-between">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-200">
            {type === 'pressure' ? '배관 가스 압력 루프' : '사용자 정의 공정 루프'}
          </span>
        </div>
        <span className="font-mono text-xs text-cyan-400 font-semibold">{pv.toFixed(2)} {unit}</span>
      </div>

      {/* Block Diagram Visual */}
      <div className="my-3 h-40 bg-slate-950/80 rounded-lg border border-slate-700/60 p-3 flex items-center justify-between text-xs font-mono">
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-amber-400">SP</span>
          <div className="px-2 py-1 bg-amber-500/20 border border-amber-500/40 rounded text-amber-300">
            {setpoint}
          </div>
        </div>

        <ArrowRight className="w-3.5 h-3.5 text-slate-500" />

        <div className="flex flex-col items-center">
          <span className="text-[10px] text-emerald-400">PID</span>
          <div className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded text-emerald-300">
            MV: {mv.toFixed(1)}%
          </div>
        </div>

        <ArrowRight className="w-3.5 h-3.5 text-slate-500" />

        <div className="flex flex-col items-center">
          <span className="text-[10px] text-cyan-400">Plant G(s)</span>
          <div className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded text-cyan-300">
            PV: {pv.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="bg-slate-950/60 p-2 rounded border border-slate-800/80">
          <span className="text-slate-500 block text-[10px]">공정 이득 (K)</span>
          <span className="text-cyan-400 font-semibold">{process.gain}</span>
        </div>
        <div className="bg-slate-950/60 p-2 rounded border border-slate-800/80">
          <span className="text-slate-500 block text-[10px]">시정수 (τ) / 지연 (θ)</span>
          <span className="text-slate-300 font-semibold">{process.tau1}s / {process.deadTime}s</span>
        </div>
      </div>
    </div>
  );
};
