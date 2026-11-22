/*
 * Уровень 0: идеальный цикл Отто (формулы 3.4–3.5) — постоянная теплоёмкость, адиабаты, подвод теплоты при V = const.
 *
 *   ottoIdeal(engine, params) → точки цикла 1–4 (p, T, V), подведённая и отведённая теплота Q1, Q2,
 *     термический КПД η_t = 1 − ε^(1−k), работа и среднее давление цикла.
 *     Поля pa, Ta, pr, nComp, nExp, pz, Tz, Tb, Tr нужны для cycleState (давление по углу цикла).
 */
'use strict';
const { geometry } = require('../geometry');
const { withDefaults } = require('../params');

function ottoIdeal(engine, regime) {
  const params = withDefaults(regime);
  const geom = geometry(engine);
  const k = params.k, cr = engine.cr;
  const cvConst = params.Rgas / (k - 1);
  const m = (params.pa * geom.Va) / (params.Rgas * params.Ta);
  const heatPerKg = params.Hu / (1 + params.alphaAir * params.l0);
  const T2 = params.Ta * cr ** (k - 1);
  const p2 = params.pa * cr ** k;
  const T3 = T2 + heatPerKg / cvConst;
  const p3 = (p2 * T3) / T2;
  const T4 = T3 / cr ** (k - 1);
  const p4 = p3 / cr ** k;
  const etaT = 1 - cr ** (1 - k);
  const Q1 = m * heatPerKg;
  const work = etaT * Q1;
  return {
    level: 0,
    m,
    q: heatPerKg,
    cv: cvConst,
    points: [
      { p: params.pa, T: params.Ta, V: geom.Va },
      { p: p2, T: T2, V: geom.Vc },
      { p: p3, T: T3, V: geom.Vc },
      { p: p4, T: T4, V: geom.Va },
    ],
    Q1,
    Q2: Q1 - work,
    etaT,
    work,
    pMean: work / geom.Vh,
    pa: params.pa,
    Ta: params.Ta,
    pr: params.pa,
    nComp: k,
    nExp: k,
    pz: p3,
    Tz: T3,
    Tb: T4,
    Tr: params.Ta,
  };
}

module.exports = { ottoIdeal };
