import React from 'react';
import { ProcessModel } from '../types/pid';
import { Flame, Droplet, Cpu, Gauge, Settings2, Plus } from 'lucide-react';

interface ProcessSelectorProps {
  processes: ProcessModel[];
  selectedProcessId: string;
  onSelectProcess: (process: ProcessModel) => void;
  onOpenEditor: () => void;
  onNewCustomProcess: () => void;
}

export const ProcessSelector: React.FC<ProcessSelectorProps> = ({
  processes,
  selectedProcessId,
  onSelectProcess,
  onOpenEditor,
  onNewCustomProcess,
}) => {
  const getIcon = (type: ProcessModel['type']) => {
    switch (type) {
      case 'thermal':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'level':
        return <Droplet className="w-4 h-4 text-cyan-400" />;
      case 'motor':
        return <Cpu className="w-4 h-4 text-emerald-400" />;
      case 'pressure':
      default:
        return <Gauge className="w-4 h-4 text-purple-400" />;
    }
  };

  const currentProcess = processes.find((p) => p.id === selectedProcessId) || processes[0];

  return (
    <div className="flex flex-col gap-3 bg-slate-900/80 rounded-xl border border-slate-800 p-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-200">선택된 산업 공정 모델</span>
          <span className="text-[11px] font-mono text-cyan-400">
            {currentProcess.order === 1 ? '1차 FOPDT' : '2차 SOPDT'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Edit current process */}
          <button
            onClick={onOpenEditor}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            title="현재 공정 파라미터(K, tau, dead-time) 수정"
          >
            <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>공정 수정</span>
          </button>

          {/* Create new custom process */}
          <button
            onClick={onNewCustomProcess}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            title="새 사용자 정의 공정 추가"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>새 공정</span>
          </button>
        </div>
      </div>

      {/* Process Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {processes.map((proc) => {
          const isSelected = proc.id === selectedProcessId;
          return (
            <button
              key={proc.id}
              onClick={() => onSelectProcess(proc)}
              className={`p-2.5 rounded-lg border text-left flex flex-col gap-1.5 transition-all relative overflow-hidden ${
                isSelected
                  ? 'border-cyan-500/80 bg-cyan-950/30 text-white shadow-sm ring-1 ring-cyan-500/40'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5">
                  {getIcon(proc.type)}
                  <span className="font-semibold text-xs truncate max-w-[120px]">{proc.koreanName}</span>
                </div>
              </div>

              {/* Monospace Parameter summary */}
              <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500">
                <span>K={proc.gain}</span>
                <span>·</span>
                <span>τ={proc.tau1}s</span>
                <span>·</span>
                <span>θ={proc.deadTime}s</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Process Description & Transfer Function */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-slate-950/80 rounded-lg border border-slate-800/80 text-xs">
        <div className="text-slate-400 line-clamp-1">{currentProcess.description}</div>
        <div className="font-mono text-[11px] text-cyan-300/90 shrink-0 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
          {currentProcess.isIntegrating
            ? `G(s) = ${currentProcess.gain} / [s(${currentProcess.tau1}s + 1)] · e^(-${currentProcess.deadTime}s)`
            : currentProcess.order === 2
            ? `G(s) = ${currentProcess.gain} / [(${currentProcess.tau1}s+1)(${currentProcess.tau2}s+1)] · e^(-${currentProcess.deadTime}s)`
            : `G(s) = ${currentProcess.gain} / (${currentProcess.tau1}s + 1) · e^(-${currentProcess.deadTime}s)`}
        </div>
      </div>
    </div>
  );
};
