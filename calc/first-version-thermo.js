/*
 * Упрощённая термодинамика первой версии симуляции — то, что модели показывали до подключения ядра.
 * Нужна только для таблицы «было → стало» в отчёте; в самой симуляции её больше нет.
 *
 * Бензиновые I4 и B4: цикл Отто с одним показателем политропы n для сжатия и расширения и заданной
 * температурой в конце сгорания T3; выпуск — изобара, температура линейно спадает к T впуска.
 * Дизель V8: смешанный цикл с n1, n2, λ и ρ. Работа — интеграл ∮p dV по точкам цикла (трапеции).
 *
 *   firstVersionCycle(key) → { workPerCycle (Дж), maxPressure (Па), power(rpm) (Вт), torque(rpm) (Н·м) }
 */
'use strict';
const { Core } = require('./lib');

const GAS = {
  I4: { n: 1.30, pIn: 92000, TIn: 320, pEx: 105000, T3: 2250, cr: 10.5, stepDeg: 2 },
  B4: { n: 1.30, pIn: 94000, TIn: 320, pEx: 106000, T3: 2300, cr: 10, stepDeg: 2 },
  V8: { n1: 1.36, n2: 1.27, pIn: 1.55e5, TIn: 345, pEx: 1.35e5, lambda: 1.45, rho: 1.45, cr: 17, stepDeg: 1 },
};

function otto(gas, volume, Vc, Va) {
  const p2 = gas.pIn * Math.pow(gas.cr, gas.n);
  const T2 = gas.TIn * Math.pow(gas.cr, gas.n - 1);
  const p3 = p2 * (gas.T3 / T2);
  return {
    maxPressure: p3,
    pressureAt(phase) {
      const V = volume(phase);
      if (phase < 180) return gas.pIn;
      if (phase < 360) return gas.pIn * Math.pow(Va / V, gas.n);
      if (phase < 540) return p3 * Math.pow(Vc / V, gas.n);
      return gas.pEx;
    },
  };
}

function mixed(gas, volume, Vc, Va) {
  const pz = gas.pIn * Math.pow(gas.cr, gas.n1) * gas.lambda;
  const Vz = Vc * gas.rho;
  return {
    maxPressure: pz,
    pressureAt(phase) {
      const V = volume(phase);
      if (phase < 180) return gas.pIn;
      if (phase < 360) return gas.pIn * Math.pow(Va / V, gas.n1);
      if (phase < 540) return V <= Vz ? pz : pz * Math.pow(Vz / V, gas.n2);
      return gas.pEx;
    },
  };
}

function firstVersionCycle(key) {
  const engine = Core.SIM_ENGINES[key], gas = GAS[key];
  const area = Math.PI * engine.bore * engine.bore / 4;
  const Vc = area * engine.stroke / (gas.cr - 1), Va = Vc + area * engine.stroke;
  const r = engine.stroke / 2, L = engine.rod;
  const volume = (phase) => {
    const psi = (phase % 360) * Core.DEG;
    return Vc + area * (r * (1 - Math.cos(psi)) + (L - Math.sqrt(L * L - r * r * Math.sin(psi) ** 2)));
  };
  const cycle = key === 'V8' ? mixed(gas, volume, Vc, Va) : otto(gas, volume, Vc, Va);
  const points = [];
  for (let phase = 0; phase <= 720; phase += gas.stepDeg) points.push({ p: cycle.pressureAt(phase % 720), V: volume(phase % 720) });
  let work = 0;
  for (let k = 0; k < points.length - 1; k++) work += 0.5 * (points[k].p + points[k + 1].p) * (points[k + 1].V - points[k].V);
  const workPerCycle = Math.abs(work);
  const power = (rpm) => workPerCycle * engine.cylinders * rpm / 120;
  return { workPerCycle, maxPressure: cycle.maxPressure, power, torque: (rpm) => (rpm > 0 ? power(rpm) / (2 * Math.PI * rpm / 60) : 0) };
}

module.exports = { firstVersionCycle };
