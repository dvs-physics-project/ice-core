/*
 * Раздел 9 отчёта. Динамика ВАЗ-21126 при 3000 об/мин (массы из руководства по ремонту).
 *   forces380 — силы в КШМ при Φ = 380° (20° после ВМТ рабочего хода);
 *   inertia   — сила инерции поступательных масс в ВМТ и НМТ;
 *   torque    — крутящий момент четырёх цилиндров (порядок 1-3-4-2) и цилиндра 1, средний момент двумя
 *               способами (по кривой и по работе цикла), неравномерность хода;
 *   balance   — наибольшие равнодействующие сил инерции 1-го и 2-го порядка четырёх компоновок за оборот.
 */
'use strict';
const { Core, round, save } = require('./lib');

const engine = Core.VAZ21126, params = Core.DEFAULT_PARAMS, DEG = Core.DEG, rpm = 3000, omega = Core.omegaOf(rpm);
const sim = Core.simulateCycle(engine, {}, { rpm, stepDeg: 0.5 });
const reciprocatingMass = Core.reciprocatingMass(params);

const phase = 380, alpha = (phase % 360) * DEG;
const force = Core.forces(engine, params, sim.state(phase).p, alpha, omega);
const piston = Core.kinematics(engine, alpha, omega);
const forces380 = {
  p: round(sim.state(phase).p / 1e5, 2), beta: round(piston.beta / DEG, 3), a: round(piston.a, 1), Fg: round(force.Fg, 0), Fj: round(force.Fj, 0),
  Fsum: round(force.Fsum, 0), FN: round(force.FN, 0), Frod: round(force.Frod, 0), T: round(force.Ftau, 0), K: round(force.FK, 0), M: round(force.torque, 1),
};
const inertiaAt = (crankAngle, w) => round(-reciprocatingMass * Core.kinematics(engine, crankAngle, w).a, 0);
const inertia = {
  mj: round(reciprocatingMass, 3),
  tdc3000: inertiaAt(0, omega),
  bdc3000: inertiaAt(Math.PI, omega),
  tdc5600: inertiaAt(0, Core.omegaOf(5600)),
};

const inline4 = Core.layouts.inline4();
const torque = Core.torqueCurve(engine, inline4, sim.state, {}, rpm, 1);
const curve = [];
let cylinderMax = -Infinity, cylinderMin = Infinity, cylinderMaxAt = 0;
for (let theta = 0; theta < 720; theta++) {
  const cylinderPhase = (theta + 360) % 720;
  const cylinderTorque = Core.forces(engine, params, sim.state(cylinderPhase).p, (cylinderPhase % 360) * DEG, omega).torque;
  if (cylinderTorque > cylinderMax) { cylinderMax = cylinderTorque; cylinderMaxAt = theta; }
  cylinderMin = Math.min(cylinderMin, cylinderTorque);
  curve.push({ th: theta, sum: round(torque.M[theta], 2), cyl: round(cylinderTorque, 2) });
}
const netWork = sim.Li + sim.Lpump;

const balance = {};
const layouts = { inline4, boxer4: Core.layouts.boxer4(), vee8: Core.layouts.vee8(90), radial5: Core.layouts.radial(5) };
for (const [name, layout] of Object.entries(layouts)) {
  let first = 0, second = 0;
  for (let theta = 0; theta < 360; theta += 1) {
    const resultant = Core.inertiaResultant(engine, layout, params, theta, omega);
    first = Math.max(first, Math.hypot(...resultant.F1));
    second = Math.max(second, Math.hypot(...resultant.F2));
  }
  balance[name] = { first: round(first, 0), second: round(second, 0) };
}

save('dynamics', {
  rpm,
  forces380,
  inertia,
  amplitude: round(reciprocatingMass * Core.geometry(engine).R * omega * omega, 0),
  torque: {
    mean: round(torque.mean, 2), max: round(torque.max, 1), min: round(torque.min, 1),
    meanFromWork: round(engine.cylinders * netWork / (4 * Math.PI), 2), LiNet: round(netWork, 1),
    cylMax: round(cylinderMax, 1), cylMaxAt: cylinderMaxAt, cylMin: round(cylinderMin, 1),
    excessWork: round(torque.excessWork, 1), irregularity: round(torque.irregularity, 4), J: params.J,
  },
  balance,
  curve,
});
