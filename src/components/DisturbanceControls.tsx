import React from 'react';
import { SimulationConfig, ProcessModel } from '../types/pid';
import { Zap, Radio, Volume2, Target } from 'lucide-react';

interface DisturbanceControlsProps {
  config: SimulationConfig;
  onChangeConfig: (newCfg: SimulationConfig) => void;
  process: ProcessModel;
  onInjectInstantDisturbance?: (magnitude: number) => void;
}

export const DisturbanceControls: React.FC<DisturbanceControlsProps> = ({
  config,
  onChangeConfig,
  process,
  onInjectInstantDisturbance,
}) => {
  const { unit, pvMin, pvMax } = process;

  return (
    <div className="flex flex-col gap-4 bg-slate-900/80 rounded-xl border border-slate-800 p-4">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
        <Target className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-semibold text-slate-200">목표값(SP) 및 외란/노이즈 설정</span>
      </div>

      {/* Target Setpoint Slider & Stepper */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-amber-300">목표값 (Setpoint SP)</label>
          <div className="flex items-center gap-1 font-mono text-xs">
            <input
              type="number"
              min={pvMin}
              max={pvMax}
              step="1"
              value={config.setpoint}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  setpoint: parseFloat(e.target.value) || 0,
                })
              }
              className="w-20 px-2 py-0.5 text-right bg-slate-950 border border-slate-700 rounded text-amber-300 focus:outline-none focus:border-amber-400"
            />
            <span className="text-slate-400">{unit}</span>
          </div>
        </div>

        <input
          type="range"
          min={pvMin}
          max={pvMax}
          step={(pvMax - pvMin) > 200 ? 5 : 0.5}
          value={config.setpoint}
          onChange={(e) =>
            onChangeConfig({
              ...config,
              setpoint: parseFloat(e.target.value),
            })
          }
          className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer accent-amber-500"
        />

        <div className="flex justify-between text-[10px] font-mono text-slate-500">
          <span>{pvMin} {unit}</span>
          <span>{((pvMax + pvMin) / 2).toFixed(0)} {unit}</span>
          <span>{pvMax} {unit}</span>
        </div>
      </div>

      {/* Setpoint Pattern Buttons */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-slate-300">목표값 형태 (Waveform)</span>
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-[11px]">
          {(['step', 'ramp', 'sine', 'square'] as const).map((type) => (
            <button
              key={type}
              onClick={() => onChangeConfig({ ...config, setpointType: type })}
              className={`py-1 rounded font-medium transition-all ${
                config.setpointType === type
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {type === 'step' && '계단 (Step)'}
              {type === 'ramp' && '경사 (Ramp)'}
              {type === 'sine' && '정현파 (Sine)'}
              {type === 'square' && '구형파 (Pulse)'}
            </button>
          ))}
        </div>
      </div>

      {/* Disturbance Injection Buttons */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-rose-400" />
            외부 공정 외란 (Load Disturbance)
          </span>
          <span className="text-[10px] font-mono text-slate-500">{config.loadDisturbance}%</span>
        </div>

        <div className="grid grid-cols-4 gap-1 text-xs">
          {[
            { label: '0%', val: 0 },
            { label: '+10%', val: 10 },
            { label: '+25%', val: 25 },
            { label: '-15%', val: -15 },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => {
                onChangeConfig({ ...config, loadDisturbance: item.val });
                if (onInjectInstantDisturbance) onInjectInstantDisturbance(item.val);
              }}
              className={`py-1.5 px-2 rounded-lg border text-center font-mono text-xs transition-colors ${
                config.loadDisturbance === item.val
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sensor Noise Slider */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-slate-400" />
            센서 계측 노이즈 (Noise Level)
          </span>
          <span className="text-xs font-mono text-cyan-400">{config.noiseStdDev.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min="0"
          max={Math.max(1, (pvMax - pvMin) * 0.05)}
          step="0.05"
          value={config.noiseStdDev}
          onChange={(e) =>
            onChangeConfig({
              ...config,
              noiseStdDev: parseFloat(e.target.value),
            })
          }
          className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />
        <div className="flex justify-between text-[10px] font-mono text-slate-500">
          <span>0 (이상적 신호)</span>
          <span>강한 노이즈</span>
        </div>
      </div>
    </div>
  );
};
