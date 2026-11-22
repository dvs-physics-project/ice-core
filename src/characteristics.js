/*
 * Скоростные характеристики.
 *
 *   speedCharacteristic(engine, params, rpms, options) — внешняя скоростная характеристика: на каждых оборотах
 *       свои p_a и T_a (для дизеля ещё и α), пошаговый расчёт цикла и показатели: p_i, p_м, p_e, N_e, M_e,
 *       η_e, удельный расход g_e
 *   leidermanPower(NeN, nN, n) — эмпирическая формула Лейдермана по номинальной мощности (для сравнения формы кривой)
 */
'use strict';
const { dieselSimParams } = require('./diesel');
const { regimeParams } = require('./intake');
const { performance, specificConsumption } = require('./performance');
const { simulateCycle } = require('./thermo/simulate');

function speedCharacteristic(engine, regime, rpms, options) {
  const isDiesel = engine.fuel === 'diesel';
  return rpms.map((rpm) => {
    const params = isDiesel ? dieselSimParams(engine, regime, rpm) : regimeParams(engine, regime, rpm);
    const sim = simulateCycle(engine, params, Object.assign({ rpm, stepDeg: 1 }, options || {}));
    const perf = performance(engine, sim.Li, rpm, params);
    const etaE = (sim.Li * perf.etaM) / sim.Qfuel;
    return {
      rpm, pa: params.pa, Ta: params.Ta, etaV: sim.etaV, pmax: sim.pmax, Li: sim.Li,
      pi: perf.pi, pm: perf.pm, pe: perf.pe, Ne: perf.Ne, Me: perf.Me,
      etaE, ge: specificConsumption(etaE, params.Hu), alpha: params.alphaAir,
    };
  });
}

const leidermanPower = (NeN, nN, n) => NeN * (n / nN) * (1 + n / nN - (n / nN) ** 2);

module.exports = { speedCharacteristic, leidermanPower };
