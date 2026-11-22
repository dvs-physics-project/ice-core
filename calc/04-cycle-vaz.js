/*
 * Раздел 6 отчёта. Рабочий цикл ВАЗ-21126 при 3000 об/мин на исходных данных команды
 * (p_a = 85 кПа, T_a = 340 К) на трёх уровнях: идеальный цикл Отто, расчётный цикл,
 * пошаговый расчёт (шаг 0,5°).
 *   curve       — давление трёх уровней, температура и доля сгоревшего топлива через 0,5°;
 *   table       — таблица приложения А; convergence — работа цикла при шагах 2…0,25°;
 *   pre360      — давление за мгновение до ВМТ (у уровней 0 и 1 в ВМТ скачок давления);
 *   results/cycle_vaz21126_3000.csv — таблица по градусам для проверки вручную.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { Core, round, comma, save, RESULTS } = require('./lib');

const engine = Core.VAZ21126, params = Core.DEFAULT_PARAMS, DEG = Core.DEG, rpm = 3000;
const ideal = Core.ottoIdeal(engine);
const level1 = Core.calcCycle(engine);
const level2 = Core.simulateCycle(engine, {}, { rpm, stepDeg: 0.5 });
const [idealStart, , idealTop] = ideal.points;
const JUST_AFTER_TDC = 360.0001;

const volume = (phase) => Core.kinematics(engine, (phase % 360) * DEG).V;
function idealPressure(phase) {
  if (phase < 180 || phase >= 540) return idealStart.p;
  if (phase <= 360) return idealStart.p * (idealStart.V / volume(phase)) ** params.k;
  return idealTop.p * (idealTop.V / volume(phase)) ** params.k;
}
const level1State = (phase) => Core.cycleState(engine, level1, phase === 360 ? JUST_AFTER_TDC : phase);
const burned = (phase) => Core.wiebe(phase, params).x;

const curve = [];
for (let phase = 0; phase < 720; phase += 0.5) {
  curve.push({
    ph: phase, V: round(volume(phase) * 1e6, 3), p0: round(idealPressure(phase === 360 ? JUST_AFTER_TDC : phase) / 1e5, 4),
    p1: round(level1State(phase).p / 1e5, 4), p2: round(level2.state(phase).p / 1e5, 4),
    T1: round(level1State(phase).T, 1), T2: round(level2.state(phase).T, 1), xb: round(burned(phase), 4),
  });
}

const table = [0, 180, 210, 240, 270, 300, 330, 340, 350, 360, 370, 373.5, 380, 390, 400, 420, 450, 480, 510, 540].map((phase) => {
  const a = level1State(phase), b = level2.state(phase);
  return [comma(phase, phase % 1 ? 1 : 0), comma(a.V * 1e6, 1), comma(a.p / 1e5, 2), comma(a.T, 0), comma(b.p / 1e5, 2), comma(b.T, 0), comma(burned(phase), 3)];
});

const convergence = [2, 1, 0.5, 0.25].map((stepDeg) => ({ step: stepDeg, Li: round(Core.simulateCycle(engine, {}, { rpm, stepDeg }).Li, 2) }));

save('cycle_vaz', {
  charge: {
    m: round(ideal.m * 1e6, 2), mCalc: round(level1.m * 1e6, 2), gammaR: round(level1.gammaR, 4), mFuel: round(level1.mFuel * 1e6, 2),
    Qfuel: round(level1.Qfuel, 1), etaV: round(level1.etaV, 3),
  },
  level0: {
    p2: round(ideal.points[1].p / 1e5, 2), T2: round(ideal.points[1].T, 1), p3: round(idealTop.p / 1e5, 1), T3: round(idealTop.T, 0),
    p4: round(ideal.points[3].p / 1e5, 2), T4: round(ideal.points[3].T, 0), etaT: round(ideal.etaT, 3), L: round(ideal.work, 1),
    pt: round(ideal.pMean / 1e5, 2), Q: round(ideal.Q1, 1),
  },
  level1: {
    pc: round(level1.pc / 1e5, 2), Tc: round(level1.Tc, 1), Tz: round(level1.Tz, 0), pz: round(level1.pz / 1e5, 2), pb: round(level1.pb / 1e5, 3),
    Tb: round(level1.Tb, 0), Li: round(level1.Li, 1), pi: round(level1.pi / 1e5, 2), etaI: round(level1.etaI, 3),
  },
  level2: {
    pmax: round(level2.pmax / 1e5, 2), phPmax: level2.phaseAtPmax, Tmax: round(level2.Tmax, 0), phTmax: level2.phaseAtTmax,
    Li: round(level2.Li, 1), pi: round(level2.pi / 1e5, 2), etaI: round(level2.etaI, 3), Lpump: round(level2.Lpump, 1),
    residual: round(level2.energyResidual, 3), Qw: round(level2.Qw, 1), n1: round(level2.n1eff, 3), n2: round(level2.n2eff, 3),
  },
  convergence,
  pre360: { p0: round(idealPressure(359.9999) / 1e5, 4), p1: round(level1State(359.9999).p / 1e5, 4) },
  series: { phi: level2.series.phaseDeg, h: level2.series.h.map((h) => round(h, 1)) },
  curve,
  table,
});

const lines = ['phase_deg;V_cm3;p_level1_bar;T_level1_K;p_level2_bar;T_level2_K;x_burned'];
for (let phase = 0; phase < 720; phase += 1) {
  const a = level1State(phase), b = level2.state(phase);
  lines.push([phase, (a.V * 1e6).toFixed(3), (a.p / 1e5).toFixed(4), a.T.toFixed(1), (b.p / 1e5).toFixed(4), b.T.toFixed(1), burned(phase).toFixed(4)].join(';'));
}
fs.writeFileSync(path.join(RESULTS, 'cycle_vaz21126_3000.csv'), lines.join('\n') + '\n');
console.log('results/cycle_vaz21126_3000.csv');
