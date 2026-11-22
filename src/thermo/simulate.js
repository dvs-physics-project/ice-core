/*
 * Уровень 2: пошаговый расчёт закрытой части цикла (180°–540°) методом Рунге — Кутты 4-го порядка
 * (формулы 3.13–3.16, 4.1–4.5).
 *
 * Неизвестная — температура газа T(Φ). На каждом шаге первый закон термодинамики даёт
 *   m·c_v·dT/dΦ = dQ_сгор − dQ_стенки − p·dV − (изменение энергии из-за смены состава),
 * где dQ_сгор — теплота по закону Вибе, dQ_стенки — теплоотдача по Вошни, давление p = m·R·T/V.
 * Попутно интегрируются работа L, теплота в стенки Qw и выделившаяся теплота Qb.
 *
 *   simulateCycle(engine, params, { rpm, stepDeg }) → результат charge() плюс:
 *     series       — массивы по углу: phaseDeg, V, p, T, x (доля сгоревшего), h, qw
 *     pmax, Tmax и углы, где они достигаются; pc, Tc (ВМТ), pb, Tb (НМТ), Tr
 *     Li           — индикаторная работа закрытой части; Lpump — работа насосных ходов; LiNet = Li + Lpump
 *     pi, etaI     — среднее индикаторное давление и индикаторный КПД
 *     Qb, Qw, dU, energyResidual — баланс энергии (невязка показывает точность интегрирования)
 *     n1eff, n2eff — эффективные показатели политроп сжатия и расширения по двум точкам кривой
 *     state(phaseDeg) — давление и температура в любой точке цикла (впуск и выпуск — изобары)
 */
'use strict';
const { geometry, strokeOf, wallArea } = require('../geometry');
const { woschni } = require('../heat/woschni');
const { kinematics, meanPistonSpeed, omegaOf } = require('../kinematics');
const { withDefaults } = require('../params');
const { charge } = require('../thermo/charge');
const { wiebe } = require('../thermo/combustion');
const { exhaustTemperature } = require('../thermo/cycle');
const { cv, uBurned, uFresh, uInt } = require('../thermo/properties');
const { DEG, mod } = require('../util');

function simulateCycle(engine, regime, settings) {
  const params = withDefaults(regime);
  const options = Object.assign({ rpm: 3000, stepDeg: 0.5 }, settings || {});
  const geom = geometry(engine);
  const chargeState = charge(engine, params);
  const omega = omegaOf(options.rpm);
  const pistonSpeed = meanPistonSpeed(engine, options.rpm);
  const burnedHeat = params.chi * chargeState.Qfuel;
  const mass = chargeState.m;

  const rates = (phaseDeg, T) => {
    const piston = kinematics(engine, (phaseDeg % 360) * DEG);
    const p = (mass * params.Rgas * T) / piston.V;
    const combustion = wiebe(phaseDeg, params);
    const heatTransfer = woschni(engine, params, { p, T, V: piston.V, phaseDeg, vp: pistonSpeed });
    const dQb = burnedHeat * combustion.dxda;
    const dQw = (heatTransfer.h * wallArea(engine, piston.x) * (T - params.Tw)) / omega;
    const dL = p * piston.dVda;
    const dUcomposition = mass * (uBurned(params, T) - uFresh(params, T)) * combustion.dxda;
    return {
      p,
      V: piston.V,
      x: combustion.x,
      h: heatTransfer.h,
      dQb,
      dQw,
      dL,
      dT: (dQb - dQw - dL - dUcomposition) / (mass * cv(params, T, combustion.x)),
    };
  };

  const steps = Math.round(360 / options.stepDeg);
  const step = options.stepDeg * DEG;
  const series = { phaseDeg: [], V: [], p: [], T: [], x: [], h: [], qw: [] };
  let T = params.Ta;
  let work = 0;
  let wallHeat = 0;
  let releasedHeat = 0;
  let pmax = 0;
  let phaseAtPmax = 0;
  let Tmax = 0;
  let phaseAtTmax = 0;
  for (let i = 0; i <= steps; i++) {
    const phase = 180 + i * options.stepDeg;
    const k1 = rates(phase, T);
    series.phaseDeg.push(phase);
    series.V.push(k1.V);
    series.p.push(k1.p);
    series.T.push(T);
    series.x.push(k1.x);
    series.h.push(k1.h);
    series.qw.push(k1.dQw);
    if (k1.p > pmax) {
      pmax = k1.p;
      phaseAtPmax = phase;
    }
    if (T > Tmax) {
      Tmax = T;
      phaseAtTmax = phase;
    }
    if (i === steps) break;
    const k2 = rates(phase + options.stepDeg / 2, T + (step / 2) * k1.dT);
    const k3 = rates(phase + options.stepDeg / 2, T + (step / 2) * k2.dT);
    const k4 = rates(phase + options.stepDeg, T + step * k3.dT);
    T += (step / 6) * (k1.dT + 2 * k2.dT + 2 * k3.dT + k4.dT);
    work += (step / 6) * (k1.dL + 2 * k2.dL + 2 * k3.dL + k4.dL);
    wallHeat += (step / 6) * (k1.dQw + 2 * k2.dQw + 2 * k3.dQw + k4.dQw);
    releasedHeat += (step / 6) * (k1.dQb + 2 * k2.dQb + 2 * k3.dQb + k4.dQb);
  }

  const interpolate = (phaseDeg) => {
    const position = (mod(phaseDeg, 720) - 180) / options.stepDeg;
    const i = Math.max(0, Math.min(steps - 1, Math.floor(position)));
    const w = position - i;
    const between = (values) => values[i] + (values[i + 1] - values[i]) * w;
    return { V: between(series.V), p: between(series.p), T: between(series.T), x: between(series.x) };
  };
  const polytropicIndex = (fromDeg, toDeg) => {
    const a = interpolate(fromDeg);
    const b = interpolate(toDeg);
    return Math.log(a.p / b.p) / Math.log(b.V / a.V);
  };

  const Tb = series.T[steps];
  const pb = series.p[steps];
  const dU = mass * (uInt(params, Tb, series.x[steps]) - uInt(params, params.Ta, 0));
  const Lpump = -(params.pr - params.pa) * geom.Vh;
  const Tr = exhaustTemperature(params, Tb, pb);
  const result = Object.assign({}, chargeState, {
    level: 2,
    rpm: options.rpm,
    series,
    pmax,
    phaseAtPmax,
    Tmax,
    phaseAtTmax,
    pc: interpolate(360).p,
    Tc: interpolate(360).T,
    pb,
    Tb,
    Tr,
    Li: work,
    Lpump,
    LiNet: work + Lpump,
    pi: work / geom.Vh,
    Qb: releasedHeat,
    Qw: wallHeat,
    dU,
    energyResidual: releasedHeat - wallHeat - work - dU,
    etaI: work / chargeState.Qfuel,
    n1eff: polytropicIndex(200, 330),
    n2eff: polytropicIndex(420, 530),
    pa: params.pa,
    Ta: params.Ta,
    pr: params.pr,
  });

  result.state = (phaseDeg) => {
    const phase = mod(phaseDeg, 720);
    if (phase >= 180 && phase <= 540) {
      const gas = interpolate(phase);
      return { phase, stroke: strokeOf(phase), V: gas.V, p: gas.p, T: gas.T };
    }
    const V = kinematics(engine, (phase % 360) * DEG).V;
    if (phase < 180) return { phase, stroke: 'intake', V, p: params.pa, T: params.Ta };
    return { phase, stroke: 'exhaust', V, p: params.pr, T: Tr };
  };
  return result;
}

module.exports = { simulateCycle };
