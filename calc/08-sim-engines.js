/*
 * Разделы 1, 11, 12 отчёта. Три двигателя симуляции (I4, B4, V8) на режиме, с которым открывается модель:
 * впуск, пошаговый расчёт цикла, баланс энергии, эффективные показатели; скоростная характеристика;
 * p–V-кривая для рисунка; «было → стало» — сравнение с упрощённой термодинамикой первой версии симуляции.
 */
'use strict';
const { Core, round, save, DEFAULT_RPM, regimeFor } = require('./lib');
const { firstVersionCycle } = require('./first-version-thermo');

const CHARACTERISTIC_RPM = {
  petrol: [1000, 2000, 3000, 4000, 5000, 6000, 6500],
  diesel: [600, 1000, 1400, 1800, 2200, 2600],
};

function engineSummary(key) {
  const engine = Core.SIM_ENGINES[key], rpm = DEFAULT_RPM[key];
  const params = regimeFor(engine, rpm);
  const sim = Core.simulateCycle(engine, params, { rpm, stepDeg: 0.5 });
  const perf = Core.performance(engine, sim.Li, rpm, params);
  const etaE = sim.Li * perf.etaM / sim.Qfuel;
  const firstVersion = firstVersionCycle(key);

  const curve = [];
  for (let phase = 180; phase <= 540; phase += 2) {
    const gas = sim.state(phase);
    curve.push([phase, round(gas.V * 1e6, 2), round(gas.p / 1e5, 3)]);
  }
  const characteristic = Core.speedCharacteristic(engine, {}, CHARACTERISTIC_RPM[engine.fuel]).map((point) => ({
    rpm: point.rpm, pa: round(point.pa / 1e3, 1), Ne: round(point.Ne / 1e3, 1), Me: round(point.Me, 1),
    etaE: round(point.etaE, 3), ge: round(point.ge, 0), pmax: round(point.pmax / 1e5, 1),
  }));

  return {
    name: engine.name, rpm, spark: params.sparkDeg, burn: params.burnDeg,
    pa: round(params.pa / 1e3, 1), Ta: round(params.Ta, 1), etaV: round(sim.etaV, 3), mFuel: round(sim.mFuel * 1e6, 2), Qt: round(sim.Qfuel, 1),
    pmax: round(sim.pmax / 1e5, 1), phPmax: sim.phaseAtPmax, Tmax: round(sim.Tmax, 0), Li: round(sim.Li, 1), pi: round(perf.pi / 1e5, 2),
    etaI: round(sim.etaI, 3), QwShare: round(sim.Qw / sim.Qfuel * 100, 1), residual: round(sim.energyResidual, 3),
    pm: round(perf.pm / 1e5, 3), pe: round(perf.pe / 1e5, 2), etaM: round(perf.etaM, 3), Ne: round(perf.Ne / 1e3, 1), Me: round(perf.Me, 1),
    etaE: round(etaE, 3), ge: round(Core.specificConsumption(etaE, params.Hu), 0),
    old: {
      W: round(firstVersion.workPerCycle, 1), N: round(firstVersion.power(rpm) / 1e3, 1),
      M: round(firstVersion.torque(rpm), 1), pmax: round(firstVersion.maxPressure / 1e5, 1),
    },
    char: characteristic,
    curve,
  };
}

save('sim_engines', Object.fromEntries(['I4', 'B4', 'V8'].map((key) => [key, engineSummary(key)])));
