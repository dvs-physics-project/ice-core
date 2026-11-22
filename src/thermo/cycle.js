/*
 * Уровень 1: расчётный цикл (формулы 3.6–3.12) — политропы сжатия и расширения, сгорание при V = const
 * с теплоёмкостью c_v(T).
 *
 *   calcCycle(engine, params)       — точки цикла c, z, b; работа сжатия и расширения; теоретическая и
 *                                     действительная (×φ_полн) индикаторная работа; p_i; η_i; η_t.
 *                                     Температура сгорания T_z находится из уравнения
 *                                     ξ_z·q_см + u_см(T_c) = u_пс(T_z) — квадратного относительно T_z.
 *   exhaustTemperature(params, Tb, pb) — температура газа после свободного выпуска (адиабата от p_b до p_r)
 *   cycleState(engine, cycle, phaseDeg) — давление и температура по углу цикла для уровней 0 и 1:
 *                                     впуск и выпуск — изобары, сжатие и расширение — политропы
 */
'use strict';
const { geometry, strokeOf } = require('../geometry');
const { kinematics } = require('../kinematics');
const { withDefaults } = require('../params');
const { charge } = require('../thermo/charge');
const { cvBurned, fStoich, uFresh } = require('../thermo/properties');
const { DEG, mod } = require('../util');

function exhaustTemperature(params, Tb, pb) {
  const kBurned = 1 + params.Rgas / cvBurned(params, Tb);
  return Tb * (params.pr / pb) ** ((kBurned - 1) / kBurned);
}

function combustionTemperature(params, Tc, heatPerKg) {
  const share = fStoich(params);
  const A = (share * params.cvBurnedB + (1 - share) * params.cvFreshB) / 2;
  const B = share * params.cvBurnedA + (1 - share) * params.cvFreshA;
  const C = -(heatPerKg + uFresh(params, Tc)) - (B * params.Tref + A * params.Tref * params.Tref);
  return (-B + Math.sqrt(B * B - 4 * A * C)) / (2 * A);
}

function calcCycle(engine, regime) {
  const params = withDefaults(regime);
  const geom = geometry(engine);
  const chargeState = charge(engine, params);
  const pc = params.pa * engine.cr ** params.n1;
  const Tc = params.Ta * engine.cr ** (params.n1 - 1);
  const qMix = (params.xiZ * chargeState.Qfuel) / chargeState.m;
  const Tz = combustionTemperature(params, Tc, qMix);
  const pz = (pc * Tz) / Tc;
  const pb = pz / engine.cr ** params.n2;
  const Tb = Tz / engine.cr ** (params.n2 - 1);
  const Tr = exhaustTemperature(params, Tb, pb);
  const Lexp = (pz * geom.Vc - pb * geom.Va) / (params.n2 - 1);
  const Lcomp = (pc * geom.Vc - params.pa * geom.Va) / (params.n1 - 1);
  const LiTheor = Lexp - Lcomp;
  const Li = params.phiFull * LiTheor;
  return Object.assign({}, chargeState, {
    level: 1,
    pc,
    Tc,
    Tz,
    pz,
    lambdaP: Tz / Tc,
    pb,
    Tb,
    Tr,
    qMix,
    Lexp,
    Lcomp,
    LiTheor,
    piTheor: LiTheor / geom.Vh,
    Li,
    pi: Li / geom.Vh,
    etaI: Li / chargeState.Qfuel,
    etaT: 1 - engine.cr ** (1 - params.k),
    pa: params.pa,
    Ta: params.Ta,
    pr: params.pr,
    nComp: params.n1,
    nExp: params.n2,
  });
}

function cycleState(engine, cycle, phaseDeg) {
  const geom = geometry(engine);
  const phase = mod(phaseDeg, 720);
  const V = kinematics(engine, (phase % 360) * DEG).V;
  let p;
  let T;
  if (phase < 180) {
    p = cycle.pa;
    T = cycle.Ta;
  } else if (phase < 360) {
    const ratio = geom.Va / V;
    p = cycle.pa * ratio ** cycle.nComp;
    T = cycle.Ta * ratio ** (cycle.nComp - 1);
  } else if (phase < 540) {
    const ratio = geom.Vc / V;
    p = cycle.pz * ratio ** cycle.nExp;
    T = cycle.Tz * ratio ** (cycle.nExp - 1);
  } else {
    p = cycle.pr;
    T = cycle.Tr;
  }
  return { phase, stroke: strokeOf(phase), V, p, T };
}

module.exports = { exhaustTemperature, calcCycle, cycleState };
