import React, { useState } from 'react';
import { PIDParameters, ProcessModel } from '../types/pid';
import { calculateAutoTuning } from '../simulation/tuningRules';
import { Sparkles, Sliders, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

interface PIDControlsProps {
  pid: PIDParameters;
  onChangePID: (newPid: PIDParameters) => void;
  process: ProcessModel;
}

export const PIDControls: React.FC<PIDControlsProps> = ({
  pid,
  onChangePID,
  process,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAutoTuning, setShowAutoTuning] = useState(false);

  const autoTuningResults = calculateAutoTuning(process);

  const updateParam = <K extends keyof PIDParameters>(key: K, val: PIDParameters[K]) => {
    onChangePID({
      ...pid,
      [key]: val,
    });
  };

  // Dynamically determine appropriate slider ranges based on process gain K
  const maxKp = Math.max(10, Math.ceil((5.0 / Math.max(0.001, process.gain)) * 2));
  const maxKi = Math.max(5, Math.ceil(maxKp / Math.max(0.1, process.tau1) * 3));
  const maxKd = Math.max(2, Math.ceil(maxKp * Math.max(0.1, process.deadTime) * 1.5));

  return (
    <div className="flex flex-col gap-4 bg-slate-900/80 rounded-xl border border-slate-800 p-4">
      {/* Section Header & Mode Buttons */}
      <div className="flex flex-col gap-2.5 pb-3 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold text-slate-100">PID 제어기 튜닝</span>
          </div>

          {/* Auto-Tuning Trigger Button */}
          <button
            onClick={() => setShowAutoTuning(!showAutoTuning)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>오토 튜닝 (Auto-Tuning)</span>
          </button>
        </div>

        {/* Controller Mode Selector */}
        <div className="grid grid-cols-5 gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
          {(['PID', 'PI', 'PD', 'P', 'MANUAL'] as const).map((m) => (
            <button
              key={m}
              onClick={() => updateParam('mode', m)}
              className={`py-1.5 rounded-md font-medium text-center transition-all ${
                pid.mode === m
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Auto-Tuning Recommendation Drawer */}
      {showAutoTuning && (
        <div className="bg-slate-950 rounded-lg border border-amber-500/30 p-3 flex flex-col gap-2 text-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-amber-300 font-semibold">
            <span>공정 모델 기반 자동 튜닝 규칙</span>
            <span className="font-mono text-[10px] text-slate-400">
              K={process.gain}, τ={process.tau1}s, θ={process.deadTime}s
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {autoTuningResults.map((res) => (
              <div
                key={res.methodName}
                className="flex items-center justify-between p-2 bg-slate-900 rounded border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-200">{res.koreanName}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{res.description}</span>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-cyan-400 mt-1">
                    <span>Kp: {res.kp}</span>
                    <span>Ki: {res.ki}</span>
                    <span>Kd: {res.kd}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onChangePID({
                      ...pid,
                      kp: res.kp,
                      ki: res.ki,
                      kd: res.kd,
                      mode: 'PID',
                    });
                  }}
                  className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded font-semibold text-xs transition-colors whitespace-nowrap ml-2"
                >
                  적용
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Mode Slider */}
      {pid.mode === 'MANUAL' ? (
        <div className="flex flex-col gap-2 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-emerald-400">수동 출력 (Manual MV)</label>
            <span className="font-mono text-sm font-bold text-white tabular-nums">
              {(pid.manualOutput ?? 0).toFixed(1)} %
            </span>
          </div>
          <input
            type="range"
            min={process.mvMin}
            max={process.mvMax}
            step={0.5}
            value={pid.manualOutput ?? 0}
            onChange={(e) => updateParam('manualOutput', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>
      ) : (
        /* Real-Time Parameter Sliders */
        <div className="flex flex-col gap-4">
          {/* Kp - Proportional Gain */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-200">비례 이득 (Kp)</span>
                <span className="text-[10px] text-slate-500">Proportional</span>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1000"
                  value={pid.kp}
                  onChange={(e) => updateParam('kp', Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-20 px-2 py-0.5 text-right font-mono text-xs bg-slate-950 border border-slate-700 rounded text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
            <input
              type="range"
              min="0"
              max={maxKp}
              step={maxKp > 50 ? 0.5 : 0.05}
              value={pid.kp}
              onChange={(e) => updateParam('kp', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>0</span>
              <span>{(maxKp / 2).toFixed(1)}</span>
              <span>{maxKp}</span>
            </div>
          </div>

          {/* Ki - Integral Gain */}
          {(pid.mode === 'PID' || pid.mode === 'PI') && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-200">적분 이득 (Ki)</span>
                  <span className="text-[10px] text-slate-500">Integral</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={pid.ki}
                    onChange={(e) => updateParam('ki', Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-20 px-2 py-0.5 text-right font-mono text-xs bg-slate-950 border border-slate-700 rounded text-cyan-300 focus:outline-none focus:border-cyan-500"
                  />
                  {pid.ki > 0 && pid.kp > 0 && (
                    <span className="text-[10px] font-mono text-slate-500 ml-1">
                      (Ti: {(pid.kp / pid.ki).toFixed(1)}s)
                    </span>
                  )}
                </div>
              </div>
              <input
                type="range"
                min="0"
                max={maxKi}
                step={maxKi > 20 ? 0.1 : 0.01}
                value={pid.ki}
                onChange={(e) => updateParam('ki', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>0</span>
                <span>{(maxKi / 2).toFixed(1)}</span>
                <span>{maxKi}</span>
              </div>
            </div>
          )}

          {/* Kd - Derivative Gain */}
          {(pid.mode === 'PID' || pid.mode === 'PD') && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-200">미분 이득 (Kd)</span>
                  <span className="text-[10px] text-slate-500">Derivative</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={pid.kd}
                    onChange={(e) => updateParam('kd', Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-20 px-2 py-0.5 text-right font-mono text-xs bg-slate-950 border border-slate-700 rounded text-cyan-300 focus:outline-none focus:border-cyan-500"
                  />
                  {pid.kd > 0 && pid.kp > 0 && (
                    <span className="text-[10px] font-mono text-slate-500 ml-1">
                      (Td: {(pid.kd / pid.kp).toFixed(2)}s)
                    </span>
                  )}
                </div>
              </div>
              <input
                type="range"
                min="0"
                max={maxKd}
                step={maxKd > 20 ? 0.1 : 0.01}
                value={pid.kd}
                onChange={(e) => updateParam('kd', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>0</span>
                <span>{(maxKd / 2).toFixed(2)}</span>
                <span>{maxKd}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Advanced PID Options Accordion */}
      <div className="border-t border-slate-800 pt-2">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full text-xs text-slate-400 hover:text-slate-200 py-1 transition-colors"
        >
          <span className="font-medium">고급 제어 옵션 (안티와인드업, 미분필터)</span>
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showAdvanced && (
          <div className="flex flex-col gap-2.5 pt-2 text-xs">
            {/* Anti-Windup Toggle */}
            <label className="flex items-center justify-between cursor-pointer p-2 rounded bg-slate-950/60 border border-slate-800">
              <div className="flex flex-col">
                <span className="font-semibold text-slate-200">안티 와인드업 (Anti-Windup)</span>
                <span className="text-[11px] text-slate-400">
                  출력 포화 시 적분 누적을 차단하여 오버슈트 억제
                </span>
              </div>
              <input
                type="checkbox"
                checked={pid.antiWindup}
                onChange={(e) => updateParam('antiWindup', e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500 bg-slate-900 border-slate-700"
              />
            </label>

            {/* Derivative on PV Toggle */}
            <label className="flex items-center justify-between cursor-pointer p-2 rounded bg-slate-950/60 border border-slate-800">
              <div className="flex flex-col">
                <span className="font-semibold text-slate-200">측정치 기반 미분 (Derivative on PV)</span>
                <span className="text-[11px] text-slate-400">
                  목표값 급변 시 미분 킥(Derivative Kick) 충격 방지
                </span>
              </div>
              <input
                type="checkbox"
                checked={pid.derivativeOnPV}
                onChange={(e) => updateParam('derivativeOnPV', e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500 bg-slate-900 border-slate-700"
              />
            </label>

            {/* Derivative Filter Factor N */}
            <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
              <div className="flex flex-col">
                <span className="font-semibold text-slate-200">미분 1차 저주파 필터 계수 (N)</span>
                <span className="text-[11px] text-slate-400">센서 고주파 노이즈 완화 (보통 8~20)</span>
              </div>
              <input
                type="number"
                min="2"
                max="50"
                value={pid.nFilter}
                onChange={(e) => updateParam('nFilter', Math.max(2, parseInt(e.target.value) || 10))}
                className="w-16 px-2 py-0.5 text-right font-mono bg-slate-900 border border-slate-700 rounded text-cyan-300"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
