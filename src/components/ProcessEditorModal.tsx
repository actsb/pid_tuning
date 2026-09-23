import React, { useState } from 'react';
import { ProcessModel } from '../types/pid';
import { X, Save, RotateCcw, HelpCircle } from 'lucide-react';

interface ProcessEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProcess: ProcessModel;
  onSaveProcess: (updated: ProcessModel) => void;
}

export const ProcessEditorModal: React.FC<ProcessEditorModalProps> = ({
  isOpen,
  onClose,
  currentProcess,
  onSaveProcess,
}) => {
  const [form, setForm] = useState<ProcessModel>({ ...currentProcess });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProcess(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h2 className="text-base font-bold text-slate-100">공정 모델 파라미터 수정 (Plant Definition)</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              공정의 동특성(이득, 시정수, 지연시간)을 수정하여 맞춤형 플랜트를 구성합니다.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 text-xs">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-300">공정 이름 (한글)</label>
              <input
                type="text"
                value={form.koreanName}
                onChange={(e) => setForm({ ...form, koreanName: e.target.value })}
                className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-300">물리 단위 (Unit)</label>
              <input
                type="text"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="°C, %, RPM, bar, m..."
                className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
          </div>

          {/* Model Order & Type */}
          <div className="flex flex-col gap-2 p-3 bg-slate-950/60 rounded-lg border border-slate-800">
            <span className="font-semibold text-slate-200">시스템 전달함수 구조 (Transfer Function)</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, order: 1, isIntegrating: false })}
                className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                  form.order === 1 && !form.isIntegrating
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="font-bold text-xs">1차 지연 (FOPDT)</span>
                <span className="font-mono text-[10px] text-slate-400">G(s) = K / (τs+1) · e^-θs</span>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, order: 2, isIntegrating: false })}
                className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                  form.order === 2 && !form.isIntegrating
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="font-bold text-xs">2차 지연 (SOPDT)</span>
                <span className="font-mono text-[10px] text-slate-400">G(s) = K / ((τ1s+1)(τ2s+1))</span>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, order: 1, isIntegrating: true })}
                className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                  form.isIntegrating
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="font-bold text-xs">적분형 (Integrating)</span>
                <span className="font-mono text-[10px] text-slate-400">G(s) = K / (s(τs+1))</span>
              </button>
            </div>
          </div>

          {/* Plant Dynamic Parameters: K, tau, theta */}
          <div className="grid grid-cols-3 gap-3">
            {/* Gain K */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-300">공정 이득 (K)</label>
                <span className="text-[10px] text-slate-500 font-mono">Gain</span>
              </div>
              <input
                type="number"
                step="0.01"
                value={form.gain}
                onChange={(e) => setForm({ ...form, gain: parseFloat(e.target.value) || 0 })}
                className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                required
              />
              <span className="text-[10px] text-slate-500">1% MV 입력당 PV 정상상태 변화량</span>
            </div>

            {/* Time constant tau1 */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-300">시정수 (τ1)</label>
                <span className="text-[10px] text-slate-500 font-mono">sec</span>
              </div>
              <input
                type="number"
                step="0.1"
                min="0.05"
                value={form.tau1}
                onChange={(e) => setForm({ ...form, tau1: Math.max(0.05, parseFloat(e.target.value) || 0.1) })}
                className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                required
              />
              <span className="text-[10px] text-slate-500">목표 도달 63.2% 소요 시간</span>
            </div>

            {/* Dead Time theta */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-300">지연시간 (Dead Time θ)</label>
                <span className="text-[10px] text-slate-500 font-mono">sec</span>
              </div>
              <input
                type="number"
                step="0.1"
                min="0"
                max="20"
                value={form.deadTime}
                onChange={(e) => setForm({ ...form, deadTime: Math.max(0, parseFloat(e.target.value) || 0) })}
                className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                required
              />
              <span className="text-[10px] text-slate-500">배관/센서 순수 지연 (Dead Time)</span>
            </div>
          </div>

          {/* Second order parameter tau2 if order is 2 */}
          {form.order === 2 && !form.isIntegrating && (
            <div className="flex flex-col gap-1.5 p-3 bg-slate-950/60 rounded-lg border border-slate-800">
              <label className="font-semibold text-slate-300">2차 시정수 (τ2, 초)</label>
              <input
                type="number"
                step="0.05"
                min="0.01"
                value={form.tau2}
                onChange={(e) => setForm({ ...form, tau2: Math.max(0.01, parseFloat(e.target.value) || 0.1) })}
                className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500">모터 인덕턴스 또는 2차 감쇠 시정수</span>
            </div>
          )}

          {/* Operating Ranges & Default Setpoint */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-300">PV 최소값 (PV Min)</label>
              <input
                type="number"
                value={form.pvMin}
                onChange={(e) => setForm({ ...form, pvMin: parseFloat(e.target.value) || 0 })}
                className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-300">PV 최대값 (PV Max)</label>
              <input
                type="number"
                value={form.pvMax}
                onChange={(e) => setForm({ ...form, pvMax: parseFloat(e.target.value) || 100 })}
                className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-300">기본 설정값 (Setpoint)</label>
              <input
                type="number"
                value={form.defaultSetpoint}
                onChange={(e) => setForm({ ...form, defaultSetpoint: parseFloat(e.target.value) || 50 })}
                className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-amber-400 font-mono focus:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-slate-300">공정 설명 및 메모</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg font-medium transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg font-bold shadow transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>공정 파라미터 적용</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
