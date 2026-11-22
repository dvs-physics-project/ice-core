/*
 * Раздел 7 отчёта. Дизель V8 симуляции: смешанный цикл с λ = ρ = 1,45 (уровень 1), проверка по количеству
 * топлива (коэффициент избытка воздуха α), пошаговый расчёт (уровень 2) и эффективные показатели.
 */
'use strict';
const { Core, round, save, DEFAULT_RPM } = require('./lib');

const engine = Core.SIM_ENGINES.V8, rpm = DEFAULT_RPM.V8;
const params = Core.dieselSimParams(engine, {}, rpm);
const level1 = Core.dieselCycle(engine, params);
const level2 = Core.simulateCycle(engine, params, { rpm, stepDeg: 0.5 });
const perf = Core.performance(engine, level2.Li, rpm, params);

const level1Curve = [];
for (let phase = 180; phase <= 540; phase += 2) {
  const gas = Core.dieselState(engine, level1, phase);
  level1Curve.push([phase, round(gas.V * 1e6, 2), round(gas.p / 1e5, 3)]);
}

save('diesel', {
  rpm, pa: round(params.pa / 1e3, 1), Ta: round(params.Ta, 1),
  level1: {
    pc: round(level1.pc / 1e5, 1), Tc: round(level1.Tc, 0), pz: round(level1.pz / 1e5, 1), Tz1: round(level1.Tz1, 0), Tz: round(level1.Tz, 0),
    Vz: round(level1.Vz * 1e6, 1), delta: round(level1.delta, 3), pb: round(level1.pb / 1e5, 2), Tb: round(level1.Tb, 0),
    Q1: round(level1.Q1, 0), mFuel: round(level1.mFuel * 1e6, 1), alpha: round(level1.alpha, 2),
    Lz: round(level1.Lz, 0), Lexp: round(level1.Lexp, 0), Lcomp: round(level1.Lcomp, 0), LiTheor: round(level1.LiTheor, 0), Li: round(level1.Li, 0),
    pi: round(level1.pi / 1e5, 2), etaI: round(level1.etaI, 3), m: round(level1.m * 1e6, 0), gammaR: round(level1.gammaR, 4),
  },
  level2: {
    sparkDeg: params.sparkDeg, burnDeg: params.burnDeg, pmax: round(level2.pmax / 1e5, 1), phPmax: level2.phaseAtPmax,
    Tmax: round(level2.Tmax, 0), Li: round(level2.Li, 1), etaI: round(level2.etaI, 3), Qw: round(level2.Qw / level2.Qfuel * 100, 1),
    residual: round(level2.energyResidual, 3),
  },
  performance: { pm: round(perf.pm / 1e5, 3), etaM: round(perf.etaM, 3), Ne: round(perf.Ne / 1e3, 1), Me: round(perf.Me, 1) },
  level1Curve,
});
