/*
 * Смешанный цикл дизеля V8 (подвод теплоты сначала при V = const, затем при p = const).
 *
 *   dieselCycle(engine, params)        — уровень 1 с заданными λ_z и ρ_z: точки c, z′, z, b; работа;
 *                                        теплота Q1, нужная для такого подвода, и отсюда «подразумеваемые»
 *                                        расход топлива и коэффициент избытка воздуха α (проверка цикла по α)
 *   dieselState(engine, cycle, phaseDeg) — давление и температура по углу цикла
 *   dieselSimParams(engine, params, rpm) — параметры пошагового расчёта: p_a и T_a по оборотам, α из уровня 1,
 *                                        сгорание начинается после задержки воспламенения от начала впрыска
 */
'use strict';
const { DIESEL_PARAMS } = require('./engines');
const { geometry } = require('./geometry');
const { regimeParams } = require('./intake');
const { kinematics } = require('./kinematics');
const { withDefaults } = require('./params');
const { uBurned, uFresh } = require('./thermo/properties');
const { DEG, mod } = require('./util');

const ALPHA_FOR_HEAT_CAPACITY = 1.8;
const EXHAUST_EXPANSION_INDEX = 1.27;

function dieselCycle(engine, regime) {
  const params = withDefaults(Object.assign({}, DIESEL_PARAMS, regime));
  const geom = geometry(engine);
  const m = (params.pa * geom.Va) / (params.Rgas * params.Ta);
  const pc = params.pa * engine.cr ** params.n1;
  const Tc = params.Ta * engine.cr ** (params.n1 - 1);
  const pz = params.lambdaZ * pc;
  const Tz1 = params.lambdaZ * Tc;
  const Tz = params.rhoZ * Tz1;
  const Vz = params.rhoZ * geom.Vc;
  const delta = geom.Va / Vz;
  const pb = pz / delta ** params.n2;
  const Tb = Tz / delta ** (params.n2 - 1);
  const products = Object.assign({}, params, { alphaAir: params.alphaGuess || ALPHA_FOR_HEAT_CAPACITY });
  const heatAtConstantVolume = m * (uBurned(products, Tz1) - uFresh(products, Tc));
  const heatAtConstantPressure = m * ((uBurned(products, Tz) - uBurned(products, Tz1)) + params.Rgas * (Tz - Tz1));
  const Q1 = heatAtConstantVolume + heatAtConstantPressure;
  const mFuel = Q1 / (params.xiZ * params.Hu);
  const gammaR = ((params.T0 + params.dT) / params.Tr) * (params.pr / (engine.cr * params.pa - params.pr));
  const mAir = m / (1 + gammaR);
  const alpha = (mAir - mFuel) / (params.l0 * mFuel);
  const Lz = pz * (Vz - geom.Vc);
  const Lexp = (pz * Vz - pb * geom.Va) / (params.n2 - 1);
  const Lcomp = (pc * geom.Vc - params.pa * geom.Va) / (params.n1 - 1);
  const LiTheor = Lz + Lexp - Lcomp;
  const Li = params.phiFull * LiTheor;
  return {
    level: 1, m, pc, Tc, pz, Tz1, Tz, Vz, delta, pb, Tb, Q1, mFuel, alpha, gammaR, Lz, Lexp, Lcomp, LiTheor, Li,
    pi: Li / geom.Vh, Qfuel: mFuel * params.Hu, etaI: Li / (mFuel * params.Hu),
    pa: params.pa, Ta: params.Ta, pr: params.pr, nComp: params.n1, nExp: params.n2,
  };
}

function dieselState(engine, cycle, phaseDeg) {
  const geom = geometry(engine);
  const phase = mod(phaseDeg, 720);
  const V = kinematics(engine, (phase % 360) * DEG).V;
  if (phase < 180) return { phase, stroke: 'intake', V, p: cycle.pa, T: cycle.Ta };
  if (phase < 360) {
    const ratio = geom.Va / V;
    return { phase, stroke: 'compression', V, p: cycle.pa * ratio ** cycle.nComp, T: cycle.Ta * ratio ** (cycle.nComp - 1) };
  }
  if (phase < 540) {
    if (V <= cycle.Vz) return { phase, stroke: 'power', V, p: cycle.pz, T: cycle.Tz1 * V / geom.Vc };
    const ratio = cycle.Vz / V;
    return { phase, stroke: 'power', V, p: cycle.pz * ratio ** cycle.nExp, T: cycle.Tz * ratio ** (cycle.nExp - 1) };
  }
  const exponent = (EXHAUST_EXPANSION_INDEX - 1) / EXHAUST_EXPANSION_INDEX;
  return { phase, stroke: 'exhaust', V, p: cycle.pr, T: cycle.Tb * (cycle.pr / cycle.pb) ** exponent };
}

function dieselSimParams(engine, regime, rpm) {
  const params = regimeParams(engine, Object.assign({}, DIESEL_PARAMS, regime), rpm);
  const cycle = dieselCycle(engine, params);
  return Object.assign({}, params, { alphaAir: cycle.alpha, sparkDeg: params.injStartDeg + params.ignDelayDeg });
}

module.exports = { dieselCycle, dieselState, dieselSimParams };
