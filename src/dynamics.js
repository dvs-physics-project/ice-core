/*
 * Силы в КШМ, крутящий момент и уравновешенность (формулы 5.1–5.8, 5.11–5.12).
 *
 *   reciprocatingMass(params)       — масса поступательно движущихся частей m_j = m_п + доля массы шатуна
 *   forces(engine, params, p, alpha, omega) — силы одного цилиндра при давлении p и угле кривошипа alpha:
 *       газовая Fg = (p − p_картера)·F, инерционная Fj = −m_j·a, суммарная, боковая FN, вдоль шатуна,
 *       тангенциальная Fτ, радиальная FK; момент Fτ·R и его газовая часть
 *   engineTorque(engine, layout, stateFn, params, θ, ω) — суммарный момент всех цилиндров при угле вала θ;
 *       stateFn(phaseDeg) даёт давление газа по углу цикла
 *   torqueCurve(engine, layout, stateFn, params, rpm, stepDeg) — момент за цикл, средний, размах;
 *       избыточная работа — размах накопленного отклонения энергии; неравномерность δ = L_изб / (J·ω²)
 *   inertiaResultant(engine, layout, params, θ, ω) — равнодействующие сил инерции 1-го и 2-го порядка
 *       в осях двигателя (y — вверх)
 */
'use strict';
const { cyclePhaseDeg, geometry, localCrankDeg } = require('./geometry');
const { kinematics, omegaOf } = require('./kinematics');
const { withDefaults } = require('./params');
const { DEG } = require('./util');

const reciprocatingMass = (params) => params.mPiston + params.rodSplit * params.mRod;

function forces(engine, regime, p, alpha, omega) {
  const params = withDefaults(regime);
  const geom = geometry(engine);
  const piston = kinematics(engine, alpha, omega);
  const Fg = (p - params.pCrankcase) * geom.F;
  const Fj = -reciprocatingMass(params) * piston.a;
  const Fsum = Fg + Fj;
  const cosBeta = Math.cos(piston.beta);
  const Ftau = (Fsum * Math.sin(alpha + piston.beta)) / cosBeta;
  return {
    Fg,
    Fj,
    Fsum,
    FN: Fsum * Math.tan(piston.beta),
    Frod: Fsum / cosBeta,
    Ftau,
    FK: (Fsum * Math.cos(alpha + piston.beta)) / cosBeta,
    torque: Ftau * geom.R,
    torqueGas: ((Fg * Math.sin(alpha + piston.beta)) / cosBeta) * geom.R,
  };
}

function engineTorque(engine, layout, stateFn, params, thetaDeg, omega) {
  let torque = 0;
  for (let j = 0; j < layout.cylinders.length; j++) {
    const gas = stateFn(cyclePhaseDeg(layout, j, thetaDeg));
    torque += forces(engine, params, gas.p, localCrankDeg(layout, j, thetaDeg) * DEG, omega).torque;
  }
  return torque;
}

function torqueCurve(engine, layout, stateFn, regime, rpm, stepDeg = 1) {
  const params = withDefaults(regime);
  const omega = omegaOf(rpm);
  const theta = [];
  const M = [];
  for (let thetaDeg = 0; thetaDeg < 720; thetaDeg += stepDeg) {
    theta.push(thetaDeg);
    M.push(engineTorque(engine, layout, stateFn, params, thetaDeg, omega));
  }
  const mean = M.reduce((sum, value) => sum + value, 0) / M.length;
  let energy = 0;
  let energyMax = 0;
  let energyMin = 0;
  for (const value of M) {
    energy += (value - mean) * stepDeg * DEG;
    energyMax = Math.max(energyMax, energy);
    energyMin = Math.min(energyMin, energy);
  }
  const excessWork = energyMax - energyMin;
  return {
    theta,
    M,
    mean,
    max: Math.max(...M),
    min: Math.min(...M),
    excessWork,
    irregularity: excessWork / (params.J * omega * omega),
  };
}

function inertiaResultant(engine, layout, regime, thetaDeg, omega) {
  const params = withDefaults(regime);
  const geom = geometry(engine);
  const amplitude = reciprocatingMass(params) * geom.R * omega * omega;
  const F1 = [0, 0];
  const F2 = [0, 0];
  layout.cylinders.forEach((cylinder, j) => {
    const alpha = localCrankDeg(layout, j, thetaDeg) * DEG;
    const axis = [Math.cos(cylinder.axisDeg * DEG), Math.sin(cylinder.axisDeg * DEG)];
    const first = -amplitude * Math.cos(alpha);
    const second = -amplitude * geom.lambda * Math.cos(2 * alpha);
    F1[0] += first * axis[0];
    F1[1] += first * axis[1];
    F2[0] += second * axis[0];
    F2[1] += second * axis[1];
  });
  return { F1, F2, amplitude };
}

module.exports = { reciprocatingMass, forces, engineTorque, torqueCurve, inertiaResultant };
