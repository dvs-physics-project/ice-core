/*
 * Коэффициент теплоотдачи от газа к стенке по Вошни (формулы 4.3–4.4).
 *
 *   woschni(engine, params, gas) → { h — Вт/(м²·К), w — характерная скорость газа, pMot — давление прокрутки }
 *     gas = { p, T, V, phaseDeg, vp }: давление, температура, объём, угол цикла и средняя скорость поршня.
 *     После начала сгорания к скорости 2,28·v_п добавляется слагаемое от роста давления над прокруткой.
 */
'use strict';
const { geometry } = require('../geometry');

function woschni(engine, params, gas) {
  const geom = geometry(engine);
  const pMot = params.pa * (geom.Va / gas.V) ** params.n1;
  const combustionTerm = gas.phaseDeg >= params.sparkDeg ? 3.24e-3 : 0;
  const w = 2.28 * gas.vp + combustionTerm * ((geom.Vh * params.Ta) / (params.pa * geom.Va)) * Math.max(0, gas.p - pMot);
  const h = 3.26 * engine.bore ** -0.2 * (gas.p / 1000) ** 0.8 * gas.T ** -0.53 * w ** 0.8;
  return { h, w, pMot };
}

module.exports = { woschni };
