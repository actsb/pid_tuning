import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { ProcessSelector } from './components/ProcessSelector';
import { PIDControls } from './components/PIDControls';
import { DisturbanceControls } from './components/DisturbanceControls';
import { InteractiveScope } from './components/InteractiveScope';
import { PhysicalDiagram } from './components/PhysicalDiagram';
import { MetricsCard } from './components/MetricsCard';
import { TermBreakdownChart } from './components/TermBreakdownChart';
import { ProcessEditorModal } from './components/ProcessEditorModal';
import { TuningGuide } from './components/TuningGuide';
import {
  DEFAULT_PROCESSES,
  getCustomProcesses,
  saveCustomProcess,
} from './simulation/defaultProcesses';
import {
  ProcessSimulatorState,
  simulateFullResponse,
} from './simulation/pidEngine';
import { calculateMetrics } from './simulation/metrics';
import {
  PIDParameters,
  ProcessModel,
  SimulationConfig,
  SimulationDataPoint,
} from './types/pid';

export default function App() {
  // Navigation tab
  const [activeTab, setActiveTab] = useState<'simulator' | 'guide'>('simulator');

  // Process list & active process
  const [processes, setProcesses] = useState<ProcessModel[]>(() => {
    const custom = getCustomProcesses();
    return [...DEFAULT_PROCESSES, ...custom];
  });
  const [selectedProcessId, setSelectedProcessId] = useState<string>(DEFAULT_PROCESSES[0].id);

  const activeProcess = useMemo(() => {
    return processes.find((p) => p.id === selectedProcessId) || processes[0];
  }, [processes, selectedProcessId]);

  // Active PID parameters
  const [pid, setPid] = useState<PIDParameters>(() => activeProcess.recommendedPID);

  // Simulation configuration
  const [config, setConfig] = useState<SimulationConfig>({
    dt: 0.05,
    duration: 50,
    setpoint: activeProcess.defaultSetpoint,
    initialSetpoint: activeProcess.initialValue,
    stepTime: 1.0,
    loadDisturbance: 0,
    disturbanceTime: 25.0,
    noiseStdDev: 0,
    setpointType: 'step',
  });

  // Runner mode: 'static' (instant step-response) vs 'realtime' (continuous running hardware emulation)
  const [runnerMode, setRunnerMode] = useState<'realtime' | 'static'>('static');
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);

  // Simulation data points & transient metrics
  const [simulationData, setSimulationData] = useState<SimulationDataPoint[]>([]);

  // Modal state for process editing
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);

  // Real-time stateful runner instance
  const realTimeStateRef = useRef<ProcessSimulatorState | null>(null);
  const realTimeHistoryRef = useRef<SimulationDataPoint[]>([]);
  const lastAnimTimeRef = useRef<number>(performance.now());
  const instantDisturbanceRef = useRef<number>(0);

  // Instant static simulation whenever PID, Process, or Config changes in static mode
  const recomputeStaticSimulation = useCallback(() => {
    const data = simulateFullResponse(activeProcess, pid, config);
    setSimulationData(data);
  }, [activeProcess, pid, config]);

  // Initial & reactive static simulation trigger
  useEffect(() => {
    if (runnerMode === 'static') {
      recomputeStaticSimulation();
    }
  }, [runnerMode, recomputeStaticSimulation]);

  // Reset simulator state
  const handleReset = useCallback(() => {
    if (runnerMode === 'static') {
      recomputeStaticSimulation();
    } else {
      realTimeStateRef.current = new ProcessSimulatorState(activeProcess, pid, config);
      realTimeHistoryRef.current = [];
      instantDisturbanceRef.current = 0;
      setSimulationData([]);
    }
  }, [runnerMode, activeProcess, pid, config, recomputeStaticSimulation]);

  // Update PID / process when switching processes
  const handleSelectProcess = (proc: ProcessModel) => {
    setSelectedProcessId(proc.id);
    setPid({ ...proc.recommendedPID });
    setConfig((prev) => ({
      ...prev,
      setpoint: proc.defaultSetpoint,
      initialSetpoint: proc.initialValue,
      loadDisturbance: 0,
    }));
  };

  // Save modified or new process
  const handleSaveProcess = (updated: ProcessModel) => {
    saveCustomProcess(updated);
    setProcesses((prev) => {
      const idx = prev.findIndex((p) => p.id === updated.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [...prev, updated];
    });
    setSelectedProcessId(updated.id);
    setConfig((prev) => ({
      ...prev,
      setpoint: updated.defaultSetpoint,
      initialSetpoint: updated.initialValue,
    }));
  };

  // Create new custom process template
  const handleNewCustomProcess = () => {
    const newId = `custom-proc-${Date.now()}`;
    const newProc: ProcessModel = {
      id: newId,
      type: 'custom',
      name: 'Custom Plant',
      koreanName: `사용자 정의 공정 ${processes.length + 1}`,
      description: '사용자가 직접 정의한 전달함수 및 파라미터를 가진 커스텀 공정 모델입니다.',
      order: 1,
      gain: 2.0,
      tau1: 5.0,
      tau2: 0,
      deadTime: 1.0,
      initialValue: 0.0,
      unit: '%',
      pvMin: 0,
      pvMax: 100,
      mvMin: 0,
      mvMax: 100,
      defaultSetpoint: 50.0,
      recommendedPID: {
        kp: 1.5,
        ki: 0.2,
        kd: 0.5,
        nFilter: 10,
        antiWindup: true,
        derivativeOnPV: true,
        mode: 'PID',
      },
    };
    handleSaveProcess(newProc);
    setIsEditorOpen(true);
  };

  // Real-time animation loop
  useEffect(() => {
    if (runnerMode !== 'realtime') return;

    if (!realTimeStateRef.current) {
      realTimeStateRef.current = new ProcessSimulatorState(activeProcess, pid, config);
    } else {
      realTimeStateRef.current.process = activeProcess;
      realTimeStateRef.current.pid = pid;
      realTimeStateRef.current.config = config;
    }

    let animId: number;

    const tick = (now: number) => {
      const elapsedSec = (now - lastAnimTimeRef.current) / 1000;
      lastAnimTimeRef.current = now;

      if (isRunning && realTimeStateRef.current) {
        const dt = config.dt;
        const totalSimTime = Math.min(0.2, elapsedSec * simSpeed);
        const steps = Math.max(1, Math.round(totalSimTime / dt));

        for (let s = 0; s < steps; s++) {
          const pt = realTimeStateRef.current.step(
            config.setpoint,
            config.loadDisturbance + instantDisturbanceRef.current
          );

          realTimeHistoryRef.current.push(pt);
        }

        // Keep rolling window of last 60 seconds (1200 points)
        const maxPoints = Math.ceil(60 / dt);
        if (realTimeHistoryRef.current.length > maxPoints) {
          realTimeHistoryRef.current = realTimeHistoryRef.current.slice(-maxPoints);
        }

        setSimulationData([...realTimeHistoryRef.current]);
      }

      animId = requestAnimationFrame(tick);
    };

    lastAnimTimeRef.current = performance.now();
    animId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animId);
  }, [runnerMode, isRunning, simSpeed, activeProcess, pid, config]);

  // Compute metrics
  const metrics = useMemo(() => {
    return calculateMetrics(
      simulationData,
      config.stepTime,
      config.setpoint,
      config.initialSetpoint
    );
  }, [simulationData, config.stepTime, config.setpoint, config.initialSetpoint]);

  // Current real-time PV and MV values for physical visualization
  const currentPt = simulationData.length > 0 ? simulationData[simulationData.length - 1] : null;
  const livePv = currentPt?.pv ?? activeProcess.initialValue;
  const liveMv = currentPt?.mv ?? 0;

  // Export CSV
  const handleExportCSV = () => {
    if (simulationData.length === 0) return;
    const header = 'Time(s),Setpoint,PV,MV(%),Error,P_Term,I_Term,D_Term,Disturbance\n';
    const rows = simulationData
      .map(
        (d) =>
          `${d.time.toFixed(3)},${d.setpoint.toFixed(3)},${d.pv.toFixed(3)},${d.mv.toFixed(
            3
          )},${d.error.toFixed(3)},${d.pTerm.toFixed(3)},${d.iTerm.toFixed(3)},${d.dTerm.toFixed(
            3
          )},${d.disturbance.toFixed(3)}`
      )
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `pid_simulation_${activeProcess.id}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isRunning={isRunning}
        onToggleRun={() => setIsRunning(!isRunning)}
        onReset={handleReset}
        simSpeed={simSpeed}
        onChangeSpeed={setSimSpeed}
        onExportCSV={handleExportCSV}
        mode={runnerMode}
        setMode={(m) => {
          setRunnerMode(m);
          handleReset();
        }}
      />

      {/* Main Content Area */}
      {activeTab === 'guide' ? (
        <TuningGuide />
      ) : (
        <main className="flex-1 max-w-[1720px] w-full mx-auto p-4 lg:p-6 flex flex-col gap-5">
          {/* 1. Process Selector Ribbon */}
          <ProcessSelector
            processes={processes}
            selectedProcessId={selectedProcessId}
            onSelectProcess={handleSelectProcess}
            onOpenEditor={() => setIsEditorOpen(true)}
            onNewCustomProcess={handleNewCustomProcess}
          />

          {/* 2. Primary 2-Column Split Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Control Column (Sliders & Parameters) */}
            <div className="lg:col-span-4 xl:col-span-4 flex flex-col gap-4">
              {/* PID Controller Tuning Sliders */}
              <PIDControls pid={pid} onChangePID={setPid} process={activeProcess} />

              {/* Setpoint & Disturbance Generator */}
              <DisturbanceControls
                config={config}
                onChangeConfig={setConfig}
                process={activeProcess}
                onInjectInstantDisturbance={(mag) => {
                  instantDisturbanceRef.current = mag;
                  setTimeout(() => {
                    instantDisturbanceRef.current = 0;
                  }, 3000);
                }}
              />

              {/* Physical Process Visualizer */}
              <PhysicalDiagram
                process={activeProcess}
                pv={livePv}
                setpoint={config.setpoint}
                mv={liveMv}
              />
            </div>

            {/* Right Visualization & Analytical Column */}
            <div className="lg:col-span-8 xl:col-span-8 flex flex-col gap-4">
              {/* Transient Performance Metrics Scorecard */}
              <MetricsCard metrics={metrics} unit={activeProcess.unit} />

              {/* Primary Interactive Oscilloscope */}
              <div className="flex-1 min-h-[440px]">
                <InteractiveScope
                  data={simulationData}
                  metrics={metrics}
                  unit={activeProcess.unit}
                  pvMin={activeProcess.pvMin}
                  pvMax={activeProcess.pvMax}
                  mvMin={activeProcess.mvMin}
                  mvMax={activeProcess.mvMax}
                  setpoint={config.setpoint}
                  stepTime={config.stepTime}
                />
              </div>

              {/* P, I, D Terms Breakdown Sub-Chart */}
              <TermBreakdownChart data={simulationData} />
            </div>
          </div>
        </main>
      )}

      {/* Process Definition / Customization Modal */}
      <ProcessEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        currentProcess={activeProcess}
        onSaveProcess={handleSaveProcess}
      />
    </div>
  );
}
