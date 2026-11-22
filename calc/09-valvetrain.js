/*
 * Раздел 10 отчёта. Газораспределение и приводы двигателей симуляции.
 * Подъём клапанов берётся из 3D-моделей (spec.js): у I4 h = H(1 − u²)² прямо на клапане, у B4 — через
 * коромысло, у V8 — через толкатель, штангу и коромысло.
 *   valves     — высота подъёма, угол вершины, фазы по нулевому подъёму и по подъёму 1 мм, наибольшие
 *                скорость и ускорения клапана на наибольших оборотах (численные производные, шаг 0,5°);
 *   analytic   — формулы для I4: ускорение на вершине и на склоне, сила пружины, перекрытие клапанов;
 *   liftCurveI4 — кривые подъёма I4 для рисунка;
 *   drives     — ремни I4 и B4 (целое число зубьев, передаточные отношения, скорость ремня),
 *                шестерни V8, вентилятор, генератор, ТНВД, героторный насос.
 */
'use strict';
const { Core, round, save, simulationSpecs, MAX_RPM } = require('./lib');

const DEG = Core.DEG;
const specs = simulationSpecs();
const I4 = specs.I4, B4 = specs.B4, V8 = specs.V8;
const valveLift = {
  I4: (side, phase) => I4.liftAtCyclePhase(side === 'in' ? I4.INTAKE : I4.EXHAUST, phase),
  B4: (side, phase) => B4.liftAtCyclePhase(side === 'in' ? 'intake' : 'exhaust', phase),
  V8: (side, phase) => V8.liftAtCyclePhase(side === 'in' ? 'intake' : 'exhaust', phase),
};

function thresholdCrossings(samples, stepDeg, threshold) {
  let opens = null, closes = null;
  for (let i = 0; i < samples.length; i++) {
    const above = samples[i] > threshold, nextAbove = samples[(i + 1) % samples.length] > threshold;
    if (!above && nextAbove) opens = (i + 1) * stepDeg;
    if (above && !nextAbove) closes = (i + 1) * stepDeg;
  }
  return [opens, closes];
}

function speedAndAcceleration(lift, rpm) {
  const stepDeg = 0.5, dt = stepDeg * DEG / Core.omegaOf(rpm);
  let vmax = 0, amax = 0, amin = 0;
  for (let phase = 0; phase < 720; phase += stepDeg) {
    const before = lift(phase - stepDeg), now = lift(phase), after = lift(phase + stepDeg);
    if (before <= 0 && now <= 0 && after <= 0) continue;
    const v = (after - before) / (2 * dt) / 1000, a = (after - 2 * now + before) / (dt * dt) / 1000;
    vmax = Math.max(vmax, Math.abs(v));
    amax = Math.max(amax, a);
    amin = Math.min(amin, a);
  }
  return { vmax, amax, amin };
}

function valveSummary(key, side) {
  const lift = (phase) => valveLift[key](side, phase);
  const stepDeg = 0.05, samples = [];
  let H = 0, peak = 0;
  for (let phase = 0; phase < 720; phase += stepDeg) {
    const h = lift(phase);
    samples.push(h);
    if (h > H) { H = h; peak = phase; }
  }
  const atZero = thresholdCrossings(samples, stepDeg, 0.001), atOneMm = thresholdCrossings(samples, stepDeg, 1.0);
  const motion = speedAndAcceleration(lift, MAX_RPM[key]);
  return {
    rpm: MAX_RPM[key], H: round(H, 2), peak: round(peak, 1), open0: round(atZero[0], 1), close0: round(atZero[1], 1),
    open1: round(atOneMm[0], 1), close1: round(atOneMm[1], 1), vmax: round(motion.vmax, 2), amax: round(motion.amax, 0), amin: round(motion.amin, 0),
  };
}

const valves = {};
for (const key of ['I4', 'B4', 'V8']) valves[key] = { in: valveSummary(key, 'in'), ex: valveSummary(key, 'ex') };

const VALVE_MASS = 0.045;
const camSpeedFactor = Core.omegaOf(6500) / (2 * I4.camHalfWidth);
const analytic = {
  aTop: round(-4 * I4.camLift / 1000 * camSpeedFactor ** 2, 0),
  aFlank: round(8 * I4.camLift / 1000 * camSpeedFactor ** 2, 0),
  mValve: VALVE_MASS,
};
analytic.springForce = round(analytic.mValve * Math.abs(analytic.aTop), 0);
analytic.overlap1mm = round((720 - valves.I4.in.open1) + valves.I4.ex.close1, 1);
analytic.overlap0 = round((720 - valves.I4.in.open0) + valves.I4.ex.close0, 1);

const liftCurveI4 = [];
for (let phase = 0; phase < 720; phase += 2) liftCurveI4.push([phase, round(valveLift.I4('in', phase), 3), round(valveLift.I4('ex', phase), 3)]);

const drive = Core.drives;
const beltI4 = I4.solveBelt(), beltB4 = B4.solveBelt();
const pitchDiameter = (spec, teeth) => 2 * spec.pitchRadius(teeth);
const gearNames = ['crank', 'idler', 'cam', 'pump'];
const drives = {
  I4: {
    N: beltI4.teethCount, z: I4.teeth, pitch: I4.beltPitch, L: beltI4.teethCount * I4.beltPitch,
    dCrank: round(pitchDiameter(I4, I4.teeth.crank), 2), dCam: round(pitchDiameter(I4, I4.teeth.cam), 2), dPump: round(pitchDiameter(I4, I4.teeth.pump), 2),
    cam: drive.ratio(I4.teeth.crank, I4.teeth.cam), pump: round(drive.ratio(I4.teeth.crank, I4.teeth.pump), 3),
    vBelt: round(drive.beltSpeed(I4.teeth.crank, I4.beltPitch / 1000, 6500), 2),
    defl: round(beltI4.deflection, 2), tensDeg: round(beltI4.tensionerAngle / DEG, 1),
  },
  B4: {
    N: beltB4.teethCount, z: B4.teeth, pitch: B4.beltPitch, L: round(beltB4.teethCount * B4.beltPitch, 1),
    cam: drive.ratio(B4.teeth.crank, B4.teeth.cam), pump: round(drive.ratio(B4.teeth.crank, B4.teeth.pump), 3),
    vBelt: round(drive.beltSpeed(B4.teeth.crank, B4.beltPitch / 1000, 6500), 2),
  },
  V8: {
    m: V8.gearModule,
    z: Object.fromEntries(gearNames.map((name) => [name, V8.gears[name].teeth])),
    d: gearNames.map((name) => drive.gearPitchDiameter(V8.gearModule, V8.gears[name].teeth)),
    a1: drive.centerDistance(V8.gearModule, V8.gears.crank.teeth, V8.gears.idler.teeth),
    a2: drive.centerDistance(V8.gearModule, V8.gears.idler.teeth, V8.gears.cam.teeth),
    cam: round(Math.abs(V8.gearSpeedRatio.cam), 3), slip: V8.fanSlip, fanRpm: round(2600 * V8.fanSlip, 0), altRpm: round(2600 * 95 / 40, 0),
    inject: V8.injection, plungerLift: V8.injectionPump.lift,
  },
  oil: { zInner: 6, zOuter: 7, ecc: 3.2, outer: round(drive.gerotorOuterSpeed(6, 7, 1), 4) },
};

save('valvetrain', { valves, analytic, liftCurveI4, drives });
