import React from 'react';
import { Sliders, Download, RotateCcw, Play, Pause, FastForward, Activity } from 'lucide-react';

interface HeaderProps {
  activeTab: 'simulator' | 'guide';
  setActiveTab: (tab: 'simulator' | 'guide') => void;
  isRunning: boolean;
  onToggleRun: () => void;
  onReset: () => void;
  simSpeed: number;
  onChangeSpeed: (speed: number) => void;
  onExportCSV: () => void;
  mode: 'realtime' | 'static';
  setMode: (m: 'realtime' | 'static') => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isRunning,
  onToggleRun,
  onReset,
  simSpeed,
  onChangeSpeed,
  onExportCSV,
  mode,
  setMode,
}) => {
  return (
    <header className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
          <Activity className="w-4 h-4" />
        </div>
        <span className="text-base font-bold tracking-tight text-white flex items-center gap-2">
          PID Process Lab
          <span className="text-xs font-normal text-slate-400 font-mono">v2.4</span>
        </span>
      </div>

      {/* Zone 2: Clean text navigation links / segmented controls */}
      <nav className="flex items-center gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={() => setActiveTab('simulator')}
          className={`transition-colors pb-0.5 ${
            activeTab === 'simulator'
              ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
              : 'hover:text-slate-200'
          }`}
        >
          시뮬레이터
        </button>
        <button
          onClick={() => setActiveTab('guide')}
          className={`transition-colors pb-0.5 ${
            activeTab === 'guide'
              ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
              : 'hover:text-slate-200'
          }`}
        >
          PID 튜닝 이론 및 가이드
        </button>
      </nav>

      {/* Zone 3: Primary actions & simulation transport */}
      <div className="flex items-center gap-2.5">
        {/* Mode switcher: Real-time loop vs Instant Step Analysis */}
        <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 text-xs">
          <button
            onClick={() => setMode('static')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              mode === 'static'
                ? 'bg-cyan-500 text-slate-950 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
            title="슬라이더 조작 시 0~60초 과도응답 곡선 즉시 계산"
          >
            스텝 응답 해석
          </button>
          <button
            onClick={() => setMode('realtime')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              mode === 'realtime'
                ? 'bg-cyan-500 text-slate-950 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
            title="실제 산업 컨트롤러처럼 시간 경과에 따른 실시간 주행"
          >
            실시간 연속 주행
          </button>
        </div>

        {mode === 'realtime' && (
          <>
            {/* Run / Pause */}
            <button
              onClick={onToggleRun}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                isRunning
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
              }`}
            >
              {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isRunning ? '일시정지' : '실행'}</span>
            </button>

            {/* Speed selector */}
            <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 p-0.5 text-xs font-mono">
              {[1, 2, 5].map((spd) => (
                <button
                  key={spd}
                  onClick={() => onChangeSpeed(spd)}
                  className={`px-2 py-1 rounded ${
                    simSpeed === spd
                      ? 'bg-slate-700 text-cyan-400 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </>
        )}

        {/* Reset */}
        <button
          onClick={onReset}
          className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          title="초기화"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Export CSV */}
        <button
          onClick={onExportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
          title="시뮬레이션 데이터 CSV 다운로드"
        >
          <Download className="w-3.5 h-3.5 text-slate-400" />
          <span>데이터 내보내기</span>
        </button>
      </div>
    </header>
  );
};
