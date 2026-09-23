import React from 'react';
import { BookOpen, Check, AlertTriangle, ArrowRight } from 'lucide-react';

export const TuningGuide: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 py-6 px-4">
      {/* Overview Hero */}
      <div className="flex flex-col gap-2 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-2 text-cyan-400">
          <BookOpen className="w-5 h-5" />
          <span className="text-xs uppercase tracking-wider font-semibold font-mono">Control Systems Engineering</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">PID 제어 이론 및 튜닝 가이드</h1>
        <p className="text-slate-400 text-sm leading-relaxed max-w-3xl">
          비례(P), 적분(I), 미분(D) 제어기는 산업계 공정 제어 루프의 95% 이상에서 채택되는 핵심 알고리즘입니다.
          공정의 동특성(시간 지연, 시정수)을 고려하여 최적의 파라미터를 선정하는 이론 및 절차를 안내합니다.
        </p>
      </div>

      {/* P, I, D Term Foundations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* P-Term */}
        <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-cyan-300">비례 제어 (Proportional, Kp)</span>
            <span className="font-mono text-xs text-slate-500">P = Kp · e(t)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            현재 발생한 오차의 크기에 비례하여 즉각적인 조작량을 출력합니다.
          </p>
          <ul className="text-xs text-slate-400 flex flex-col gap-1 mt-1">
            <li className="flex items-center gap-1.5">
              <span className="w-1 h-1 bg-cyan-400 rounded-full" />
              <span>Kp 증가: 빠른 응답 속도, 상승시간(tr) 단축</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1 h-1 bg-rose-400 rounded-full" />
              <span>과도한 Kp: 오버슈트 증가 및 시스템 발산 불안정</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1 h-1 bg-amber-400 rounded-full" />
              <span>한계: P 제어기만으로는 잔류편차(Offset) 제거 불가</span>
            </li>
          </ul>
        </div>

        {/* I-Term */}
        <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-purple-300">적분 제어 (Integral, Ki)</span>
            <span className="font-mono text-xs text-slate-500">I = Ki · ∫ e(t) dt</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            과거 오차의 누적 합을 계산하여 정상상태 오차(잔류 편차)를 완전히 0으로 소거합니다.
          </p>
          <ul className="text-xs text-slate-400 flex flex-col gap-1 mt-1">
            <li className="flex items-center gap-1.5">
              <span className="w-1 h-1 bg-purple-400 rounded-full" />
              <span>Ki 증가: 정상상태 편차 신속 소거</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1 h-1 bg-rose-400 rounded-full" />
              <span>과도한 Ki: 주기적 진동(Hunting) 및 위상 지연 초래</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1 h-1 bg-amber-400 rounded-full" />
              <span>주의: 출력 포화 시 와인드업(Windup) 방지 필수</span>
            </li>
          </ul>
        </div>

        {/* D-Term */}
        <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-amber-300">미분 제어 (Derivative, Kd)</span>
            <span className="font-mono text-xs text-slate-500">D = Kd · de(t)/dt</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            오차의 변화 속도(기울기)를 측정하여 미래 오차를 예측하고 제동(Damping)력을 부여합니다.
          </p>
          <ul className="text-xs text-slate-400 flex flex-col gap-1 mt-1">
            <li className="flex items-center gap-1.5">
              <span className="w-1 h-1 bg-amber-400 rounded-full" />
              <span>Kd 증가: 오버슈트 억제, 시스템 감쇠력 향상</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1 h-1 bg-cyan-400 rounded-full" />
              <span>정착시간(ts) 단축 및 외란 충격 완화</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1 h-1 bg-rose-400 rounded-full" />
              <span>주의: 고주파 센서 노이즈 증폭되므로 저역통과 필터(N) 병행</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Step-by-Step Manual Tuning Recipe */}
      <div className="p-5 bg-slate-900/60 rounded-xl border border-slate-800 flex flex-col gap-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span className="text-cyan-400">01.</span>
          현장 엔지니어를 위한 단계별 수동 튜닝 (Heuristic Tuning Recipe)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex flex-col gap-1.5">
            <span className="font-bold text-cyan-400">1단계: P 이득 탐색</span>
            <span className="text-slate-300">Ki=0, Kd=0으로 설정 후 Kp를 서서히 올립니다.</span>
            <span className="text-[11px] text-slate-500 mt-1">
              목표값의 약 70~80%에 도달하며 진동이 막 시작하려는 지점을 찾습니다.
            </span>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex flex-col gap-1.5">
            <span className="font-bold text-purple-400">2단계: I 이득 추가</span>
            <span className="text-slate-300">Kp를 약간 낮춘 후 Ki를 0부터 천천히 증가시킵니다.</span>
            <span className="text-[11px] text-slate-500 mt-1">
              정상상태 잔류편차(Offset)가 0으로 소거되는 최소한의 Ki를 선정합니다.
            </span>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex flex-col gap-1.5">
            <span className="font-bold text-amber-400">3단계: D 이득 제동</span>
            <span className="text-slate-300">오버슈트나 진동이 발생하는 경우 Kd를 미세 추가합니다.</span>
            <span className="text-[11px] text-slate-500 mt-1">
              급격한 오버슈트 봉우리가 억제되고 부드럽게 정착하는지 관찰합니다.
            </span>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex flex-col gap-1.5">
            <span className="font-bold text-emerald-400">4단계: 외란 검증</span>
            <span className="text-slate-300">시뮬레이터의 외란(+10%, -10%) 버튼을 눌러 외란 복구력을 점검합니다.</span>
            <span className="text-[11px] text-slate-500 mt-1">
              외란 발생 후 신속히 원래 목표값으로 회귀하는지 확인합니다.
            </span>
          </div>
        </div>
      </div>

      {/* Auto-Tuning Rule Comparison Table */}
      <div className="p-5 bg-slate-900/60 rounded-xl border border-slate-800 flex flex-col gap-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span className="text-cyan-400">02.</span>
          자동 튜닝(Auto-Tuning) 규칙 비교 및 특성
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="py-2 px-3">규칙명</th>
                <th className="py-2 px-3">목표 및 응답 특성</th>
                <th className="py-2 px-3">추천 적용 공정</th>
                <th className="py-2 px-3">주의 사항</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-cyan-300">지글러-니콜스 (Z-N)</td>
                <td className="py-2.5 px-3">가장 빠른 감쇠 응답 (1/4 감쇠비, 약 25% 오버슈트 허용)</td>
                <td className="py-2.5 px-3">빠른 도달이 우선인 모터, 속도 제어기</td>
                <td className="py-2.5 px-3 text-slate-400">오버슈트가 민감한 화학 반응로에는 부적합</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-amber-300">코헨-쿤 (Cohen-Coon)</td>
                <td className="py-2.5 px-3">지연시간(θ)이 긴 공정에서도 안정적 모델 반영</td>
                <td className="py-2.5 px-3">열전달 지연이 큰 전열로, 가열 건조기</td>
                <td className="py-2.5 px-3 text-slate-400">센서 노이즈가 클 때 미분 필터 강화 필요</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-emerald-300">CHR (0% 무오버슈트)</td>
                <td className="py-2.5 px-3">오버슈트를 엄격하게 0%로 억제하는 안전 지향 제어</td>
                <td className="py-2.5 px-3">탱크 액체 넘침 방지, 정밀 온도 제어</td>
                <td className="py-2.5 px-3 text-slate-400">Z-N 대비 상승 시간이 다소 느릴 수 있음</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-purple-300">타이리어스-루이벤 (T-L)</td>
                <td className="py-2.5 px-3">밸브 조작량(MV) 변동을 최소화하는 보수적 산업 튜닝</td>
                <td className="py-2.5 px-3">석유화학 정제탑, 대형 유량 및 압력 배관</td>
                <td className="py-2.5 px-3 text-slate-400">제어기 이득이 상대적으로 작고 부드러움</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
