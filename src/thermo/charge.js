/*
 * Заряд цилиндра (формулы 3.1, 3.6).
 *
 *   charge(engine, params) → {
 *     m       — масса заряда в конце впуска  p_a·V_a / (R·T_a)
 *     gammaR  — коэффициент остаточных газов
 *     mFresh  — масса свежей смеси, mFuel — масса топлива, Qfuel — теплота топлива
 *     etaV    — коэффициент наполнения (свежая смесь / заряд при условиях окружающей среды)
 *     TaCheck — температура конца впуска из смешения свежего заряда и остаточных газов (для проверки T_a)
 *   }
 */
'use strict';
const { geometry } = require('../geometry');
const { withDefaults } = require('../params');

function charge(engine, regime) {
  const params = withDefaults(regime);
  const geom = geometry(engine);
  const m = (params.pa * geom.Va) / (params.Rgas * params.Ta);
  const gammaR = ((params.T0 + params.dT) / params.Tr) * (params.pr / (engine.cr * params.pa - params.pr));
  const mFresh = m / (1 + gammaR);
  const mFuel = mFresh / (1 + params.alphaAir * params.l0);
  const ambientDensity = params.p0 / (params.Rgas * params.T0);
  return {
    m,
    gammaR,
    mFresh,
    mFuel,
    Qfuel: mFuel * params.Hu,
    etaV: mFresh / (ambientDensity * geom.Vh),
    TaCheck: (params.T0 + params.dT + gammaR * params.Tr) / (1 + gammaR),
  };
}

module.exports = { charge };
