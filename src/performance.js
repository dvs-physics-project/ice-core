/*
 * Индикаторные и эффективные показатели (формулы 5.9–5.10).
 *
 *   performance(engine, Li, rpm, params) → по индикаторной работе цикла одного цилиндра Li:
 *     pi = Li/Vh, механические потери pm = pmA + pmB·v_п.ср, pe = pi − pm, η_м = pe/pi,
 *     мощности Ni = Li·i·n/120 и Ne = Ni·η_м, моменты Mi, Me = N/ω, литровая мощность
 *   specificConsumption(eta, Hu) — удельный расход топлива, г/(кВт·ч), по КПД
 */
'use strict';
const { geometry } = require('./geometry');
const { meanPistonSpeed, omegaOf } = require('./kinematics');
const { withDefaults } = require('./params');

function performance(engine, Li, rpm, regime) {
  const params = withDefaults(regime);
  const geom = geometry(engine);
  const omega = omegaOf(rpm);
  const pi = Li / geom.Vh;
  const pm = params.pmA + params.pmB * meanPistonSpeed(engine, rpm);
  const pe = pi - pm;
  const etaM = pe / pi;
  const Ni = (Li * engine.cylinders * rpm) / 120;
  const Ne = Ni * etaM;
  return { pi, pm, pe, etaM, Ni, Ne, Mi: Ni / omega, Me: Ne / omega, literPower: Ne / geom.Vtotal };
}

const specificConsumption = (eta, Hu) => 3.6e9 / (eta * Hu);

module.exports = { performance, specificConsumption };
