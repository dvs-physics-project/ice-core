/*
 * Температура стенок и тепловой баланс (формулы 4.6, 4.8–4.9).
 *
 *   wallTemperatures(q, wall) — стенка как два последовательных тепловых сопротивления (теплопроводность
 *                               стенки и теплоотдача в охлаждающую жидкость); q — плотность теплового потока,
 *                               Вт/м²; wall = { Tcoolant, hCoolant, thickness, conductivity }
 *                               → температуры поверхности со стороны газа и со стороны жидкости
 *   heatBalance(engine, sim, params) — куда уходит теплота топлива: полезная работа, механические потери,
 *                               стенки, отработавшие газы, недогорание; доли и КПД η_i, η_м, η_e
 */
'use strict';
const { withDefaults } = require('../params');
const { performance } = require('../performance');

function wallTemperatures(q, wall) {
  const TwCoolant = wall.Tcoolant + q / wall.hCoolant;
  const TwGas = TwCoolant + (q * wall.thickness) / wall.conductivity;
  return { TwGas, TwCoolant };
}

function heatBalance(engine, sim, regime) {
  const params = withDefaults(regime);
  const { etaM } = performance(engine, sim.Li, sim.rpm, params);
  const Qe = sim.Li * etaM;
  const Qm = sim.Li - Qe;
  const Qinc = sim.Qfuel - sim.Qb;
  const Qgas = sim.Qfuel - sim.Li - sim.Qw - Qinc;
  return {
    Qfuel: sim.Qfuel,
    Qe,
    Qm,
    Qw: sim.Qw,
    Qgas,
    Qinc,
    shares: {
      effective: Qe / sim.Qfuel,
      mechanical: Qm / sim.Qfuel,
      walls: sim.Qw / sim.Qfuel,
      exhaust: Qgas / sim.Qfuel,
      incomplete: Qinc / sim.Qfuel,
    },
    etaI: sim.Li / sim.Qfuel,
    etaM,
    etaE: (sim.Li * etaM) / sim.Qfuel,
  };
}

module.exports = { wallTemperatures, heatBalance };
