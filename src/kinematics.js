/*
 * Кинематика кривошипно-шатунного механизма (формулы 2.1–2.10). alpha — угол кривошипа от ВМТ, рад.
 *
 *   omegaOf(rpm)                         — угловая скорость ω = πn/30
 *   kinematics(engine, alpha, omega)     — точные формулы: угол шатуна β, расстояние y от оси вала до пальца,
 *                                          ход x, объём V, dx/dα, dV/dα, скорость и ускорение поршня,
 *                                          угловая скорость шатуна
 *   kinematicsApprox(engine, alpha, ω)   — приближённые формулы (первые члены ряда по λ)
 *   meanPistonSpeed(engine, rpm)         — средняя скорость поршня S·n/30
 */
'use strict';
const { geometry } = require('./geometry');

const omegaOf = (rpm) => (Math.PI * rpm) / 30;

function kinematics(engine, alpha, omega = 0) {
  const { R, lambda, F, Vc } = geometry(engine);
  const sin = Math.sin(alpha);
  const cos = Math.cos(alpha);
  const cosBeta = Math.sqrt(1 - lambda * lambda * sin * sin);
  const beta = Math.asin(lambda * sin);
  const y = R * cos + engine.rod * cosBeta;
  const x = R + engine.rod - y;
  const dxda = R * (sin + (lambda * sin * cos) / cosBeta);
  const a = R * omega * omega * (cos + (lambda * (Math.cos(2 * alpha) + lambda ** 2 * sin ** 4)) / cosBeta ** 3);
  return {
    beta,
    y,
    x,
    V: Vc + F * x,
    dxda,
    dVda: F * dxda,
    v: omega * dxda,
    a,
    omegaRod: (omega * lambda * cos) / cosBeta,
  };
}

function kinematicsApprox(engine, alpha, omega = 0) {
  const { R, lambda, F, Vc } = geometry(engine);
  const sin = Math.sin(alpha);
  const cos = Math.cos(alpha);
  const x = R * (1 - cos + (lambda / 2) * sin * sin);
  return {
    y: R + engine.rod - x,
    x,
    V: Vc + F * x,
    v: R * omega * (sin + (lambda / 2) * Math.sin(2 * alpha)),
    a: R * omega * omega * (cos + lambda * Math.cos(2 * alpha)),
  };
}

const meanPistonSpeed = (engine, rpm) => (engine.stroke * rpm) / 30;

module.exports = { omegaOf, kinematics, kinematicsApprox, meanPistonSpeed };
