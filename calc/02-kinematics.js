/*
 * Раздел 4 отчёта. Кинематика поршня ВАЗ-21126 при 3000 об/мин: кривые по точным и приближённым
 * формулам, таблица через 10°, пример при α = 90°, наибольшая погрешность приближения Rλ³/8.
 * extremes — наибольшая скорость поршня и ускорения в мёртвых точках на наибольших оборотах.
 */
'use strict';
const { Core, round, comma, save, MAX_RPM } = require('./lib');

const DEG = Core.DEG;
const engine = Core.VAZ21126;
const omega = Core.omegaOf(3000);

const curve = [];
for (let degrees = 0; degrees <= 360; degrees += 1) {
  const exact = Core.kinematics(engine, degrees * DEG, omega);
  const approx = Core.kinematicsApprox(engine, degrees * DEG, omega);
  curve.push({
    a: degrees, x: round(exact.x * 1e3, 4), v: round(exact.v, 4), acc: round(exact.a, 2),
    xa: round(approx.x * 1e3, 4), va: round(approx.v, 4), aa: round(approx.a, 2),
  });
}

const table = [];
for (let degrees = 0; degrees <= 180; degrees += 10) {
  const point = Core.kinematics(engine, degrees * DEG, omega);
  table.push([String(degrees), comma(point.beta / DEG, 2), comma(point.y * 1e3, 2), comma(point.x * 1e3, 2),
    comma(point.V * 1e6, 1), comma(point.v, 2), comma(point.a, 0)]);
}

const exact90 = Core.kinematics(engine, 90 * DEG, omega);
const approx90 = Core.kinematicsApprox(engine, 90 * DEG, omega);

function extremes(anyEngine, rpm) {
  const w = Core.omegaOf(rpm);
  let vmax = 0, vmaxAt = 0;
  for (let degrees = 0; degrees <= 180; degrees += 0.05) {
    const point = Core.kinematics(anyEngine, degrees * DEG, w);
    if (point.v > vmax) { vmax = point.v; vmaxAt = degrees; }
  }
  return {
    rpm, cm: round(Core.meanPistonSpeed(anyEngine, rpm), 2), vmax: round(vmax, 2), atDeg: round(vmaxAt, 1),
    aTDC: round(Core.kinematics(anyEngine, 0, w).a, 0), aBDC: round(Core.kinematics(anyEngine, Math.PI, w).a, 0),
  };
}

const { R, lambda } = Core.geometry(engine);
save('kinematics', {
  curve,
  table,
  example90: {
    beta: round(exact90.beta / DEG, 2), y: round(exact90.y * 1e3, 2), x: round(exact90.x * 1e3, 2), V: round(exact90.V * 1e6, 1),
    v: round(exact90.v, 2), a: round(exact90.a, 1), aApprox: round(approx90.a, 1),
  },
  maxErrApprox: round(R * lambda ** 3 / 8 * 1e3, 3),
  atMaxRpm: {
    VAZ: extremes(engine, 5600),
    ...Object.fromEntries(Object.entries(Core.SIM_ENGINES).map(([key, simEngine]) => [key, extremes(simEngine, MAX_RPM[key])])),
  },
});
