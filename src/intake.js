/*
 * Газообмен по оборотам и наддув.
 *
 *   intakeState(engine, params, rpm) — давление и температура в конце впуска на данных оборотах.
 *       Потери на впуске Δp_a = ζ·ρ_к·w²/2, где w = Kw·c_m — средняя скорость заряда в клапане
 *       (Kw = 6,6, ζ = β² + ξ_вп = 3 по методике теплового расчёта). С наддувом заряд перед впуском —
 *       воздух после компрессора (p_k, T_k), без наддува — окружающий воздух.
 *       T_a — из смешения свежего заряда (с подогревом ΔT) и остаточных газов.
 *   regimeParams(engine, params, rpm) — параметры режима с p_a и T_a, найденными по оборотам
 *   compressor(params, airFlow)       — работа и мощность компрессора наддува: степень повышения давления,
 *                                       температура после компрессора, удельная работа, адиабатный КПД
 */
'use strict';
const { meanPistonSpeed } = require('./kinematics');
const { withDefaults } = require('./params');

const CHARGE_SPEED_FACTOR = 6.6;
const INTAKE_LOSS_FACTOR = 3;

function intakeState(engine, regime, rpm) {
  const params = withDefaults(regime);
  const cm = meanPistonSpeed(engine, rpm);
  const pk = params.pk || params.p0;
  const Tk = params.pk ? params.T0 * (params.pk / params.p0) ** ((params.nk - 1) / params.nk) : params.T0;
  const rhoK = pk / (params.Rgas * Tk);
  const wIn = (params.Kw || CHARGE_SPEED_FACTOR) * cm;
  const dpa = (params.zetaIn || INTAKE_LOSS_FACTOR) * rhoK * wIn * wIn / 2;
  const pa = pk - dpa;
  const gammaR = ((Tk + params.dT) / params.Tr) * (params.pr / (engine.cr * pa - params.pr));
  const Ta = (Tk + params.dT + gammaR * params.Tr) / (1 + gammaR);
  return { cm, pk, Tk, rhoK, wIn, dpa, pa, Ta, gammaR };
}

function regimeParams(engine, regime, rpm) {
  const params = withDefaults(regime);
  const intake = intakeState(engine, params, rpm);
  const result = Object.assign({}, params, { pa: intake.pa, Ta: intake.Ta });
  if (params.pk) Object.assign(result, { T0: intake.Tk, p0: params.pk });
  return result;
}

function compressor(params, airFlow) {
  const cp = params.Rgas * params.k / (params.k - 1);
  const pik = params.pk / params.p0;
  const Tk = params.T0 * pik ** ((params.nk - 1) / params.nk);
  const lk = cp * (Tk - params.T0);
  const adiabaticWork = cp * params.T0 * (pik ** ((params.k - 1) / params.k) - 1);
  return { pik, Tk, lk, etaAd: adiabaticWork / lk, power: lk * airFlow };
}

module.exports = { intakeState, regimeParams, compressor };
