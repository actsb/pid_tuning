import { ProcessModel } from '../types/pid';

export const DEFAULT_PROCESSES: ProcessModel[] = [
  {
    id: 'thermal-furnace',
    type: 'thermal',
    name: 'Industrial Heating Furnace',
    koreanName: '산업용 가열로 / 열교환 공정',
    description: '전열 히터와 열전대 센서로 구성된 전형적인 1차 지연 + 순수 지연시간(Dead Time) 공정입니다.',
    order: 1,
    gain: 1.5,           // 1% MV -> 1.5°C change
    tau1: 10.0,          // 10초 시정수 (열용량 지연)
    tau2: 0,
    deadTime: 2.0,       // 2초 전송 지연 (열전달 및 센서 지연)
    initialValue: 20.0,  // 상온 20°C
    unit: '°C',
    pvMin: 0,
    pvMax: 200,
    mvMin: 0,
    mvMax: 100,
    defaultSetpoint: 80.0,
    recommendedPID: {
      kp: 2.2,
      ki: 0.18,
      kd: 1.8,
      nFilter: 10,
      antiWindup: true,
      derivativeOnPV: true,
      mode: 'PID',
    },
  },
  {
    id: 'level-tank',
    type: 'level',
    name: 'Liquid Level Buffer Tank',
    koreanName: '수위 조절 버퍼 탱크 공정',
    description: '유입 펌프 제어 밸브와 하부 배출 저항이 있는 수위 제어 공정입니다.',
    order: 1,
    gain: 1.0,           // 1% 밸브 개도 -> 1% 수위 평형
    tau1: 6.0,           // 6초 시정수
    tau2: 0,
    deadTime: 0.8,       // 0.8초 배관 지연
    initialValue: 10.0,  // 초기 수위 10%
    unit: '%',
    pvMin: 0,
    pvMax: 100,
    mvMin: 0,
    mvMax: 100,
    defaultSetpoint: 65.0,
    recommendedPID: {
      kp: 4.5,
      ki: 0.55,
      kd: 1.2,
      nFilter: 10,
      antiWindup: true,
      derivativeOnPV: true,
      mode: 'PID',
    },
  },
  {
    id: 'motor-servo',
    type: 'motor',
    name: 'DC Servo Motor Velocity',
    koreanName: 'DC 서보 모터 속도 제어 공정',
    description: '전기적 인덕턴스와 기계적 관성 모멘트로 인한 2차 시스템(2nd-order) 고속 응답 공정입니다.',
    order: 2,
    gain: 25.0,          // 1V or 1% duty -> 25 RPM
    tau1: 0.8,           // 기계적 시정수
    tau2: 0.15,          // 전기적 시정수
    deadTime: 0.1,       // 구동 드라이버 신호 지연
    initialValue: 0.0,
    unit: 'RPM',
    pvMin: 0,
    pvMax: 3000,
    mvMin: 0,
    mvMax: 100,
    defaultSetpoint: 1500.0,
    recommendedPID: {
      kp: 0.08,
      ki: 0.15,
      kd: 0.015,
      nFilter: 15,
      antiWindup: true,
      derivativeOnPV: true,
      mode: 'PID',
    },
  },
  {
    id: 'gas-pressure',
    type: 'pressure',
    name: 'Gas Header Pressure Regulation',
    koreanName: '배관 가스 압력 제어 공정',
    description: '공압 조절 밸브를 통한 배관 내 기체 압력 제어 공정으로 응답이 빠르고 외란에 민감합니다.',
    order: 1,
    gain: 0.12,          // 1% 밸브 -> 0.12 bar
    tau1: 2.5,           // 2.5초 시정수
    tau2: 0,
    deadTime: 0.4,       // 0.4초 공압 지연
    initialValue: 1.0,   // 대기압 기준 1 bar
    unit: 'bar',
    pvMin: 0,
    pvMax: 15,
    mvMin: 0,
    mvMax: 100,
    defaultSetpoint: 6.0,
    recommendedPID: {
      kp: 18.0,
      ki: 5.5,
      kd: 1.5,
      nFilter: 10,
      antiWindup: true,
      derivativeOnPV: true,
      mode: 'PID',
    },
  },
];

export const STORAGE_CUSTOM_PROCESS_KEY = 'pid_simulation_custom_processes_v1';

export function getCustomProcesses(): ProcessModel[] {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_PROCESS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCustomProcess(process: ProcessModel): void {
  try {
    const list = getCustomProcesses();
    const idx = list.findIndex((p) => p.id === process.id);
    if (idx >= 0) {
      list[idx] = process;
    } else {
      list.push(process);
    }
    localStorage.setItem(STORAGE_CUSTOM_PROCESS_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to save process to localStorage:', err);
  }
}

export function deleteCustomProcess(id: string): void {
  try {
    const list = getCustomProcesses().filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_CUSTOM_PROCESS_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to delete process from localStorage:', err);
  }
}
