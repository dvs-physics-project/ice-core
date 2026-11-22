/*
 * Геометрия цилиндра, компоновки двигателей и фазы цилиндров (формулы 1.1–1.9).
 *
 *   geometry(engine)                 — R, λ = R/L, площадь поршня F, рабочий объём Vh, объём камеры
 *                                      сгорания Vc = Vh/(ε − 1), полный объём Va, литраж, высота камеры hc
 *   wallArea(engine, x)              — поверхность теплообмена при смещении поршня x: 2F + πD(hc + x)
 *   makeLayout(axesDeg, firingOrder) — компоновка: для каждого цилиндра угол оси γ_j, место в порядке работы,
 *                                      угол вспышки θ_j = k·720°/i и угол колена δ_j = γ_j − θ_j
 *   layouts.inline4 / vee8 / boxer4 / radial(N) — готовые компоновки
 *   cyclePhaseDeg(layout, j, θ)      — угол цикла цилиндра j: 0…720°, вспышка при 360°
 *   localCrankDeg(layout, j, θ)      — угол кривошипа от ВМТ своего цилиндра, 0…360°
 *   strokeOf(phaseDeg)               — такт по углу цикла: intake, compression, power, exhaust
 */
'use strict';
const { mod } = require('./util');

function geometry(engine) {
  const R = engine.stroke / 2;
  const lambda = R / engine.rod;
  const F = (Math.PI * engine.bore * engine.bore) / 4;
  const Vh = F * engine.stroke;
  const Vc = Vh / (engine.cr - 1);
  const Va = Vc + Vh;
  return { R, lambda, F, Vh, Vc, Va, Vtotal: Vh * engine.cylinders, hc: Vc / F, SD: engine.stroke / engine.bore };
}

function wallArea(engine, x) {
  const geom = geometry(engine);
  return 2 * geom.F + Math.PI * engine.bore * (geom.hc + x);
}

function makeLayout(axesDeg, firingOrder) {
  const intervalDeg = 720 / axesDeg.length;
  const cylinders = axesDeg.map((axisDeg, j) => {
    const positionInOrder = firingOrder.indexOf(j + 1);
    if (positionInOrder < 0) throw new Error('порядок работы должен содержать каждый цилиндр');
    const fireAtDeg = positionInOrder * intervalDeg;
    let throwDeg = mod(axisDeg - fireAtDeg, 360);
    if (throwDeg > 180) throwDeg -= 360;
    return { n: j + 1, axisDeg, k: positionInOrder, fireAtDeg, throwDeg };
  });
  return { cylinders, intervalDeg, firingOrder: firingOrder.slice() };
}

const layouts = {
  inline4: () => makeLayout([0, 0, 0, 0], [1, 3, 4, 2]),
  vee8: (bankDeg = 90) =>
    makeLayout(
      [1, 2, 3, 4, 5, 6, 7, 8].map((number) => (number <= 4 ? -bankDeg / 2 : bankDeg / 2)),
      [1, 5, 4, 2, 6, 3, 7, 8]
    ),
  boxer4: () => makeLayout([-90, 90, -90, 90], [1, 3, 2, 4]),
  radial: (count) => {
    if (count % 2 === 0) throw new Error('четырёхтактная звезда требует нечётного числа цилиндров');
    const order = [];
    for (let number = 1; number <= count; number += 2) order.push(number);
    for (let number = 2; number <= count; number += 2) order.push(number);
    return makeLayout(Array.from({ length: count }, (_, j) => (360 * j) / count), order);
  },
};

const cyclePhaseDeg = (layout, j, thetaDeg) => mod(thetaDeg - layout.cylinders[j].fireAtDeg + 360, 720);

const localCrankDeg = (layout, j, thetaDeg) =>
  mod(thetaDeg + layout.cylinders[j].throwDeg - layout.cylinders[j].axisDeg, 360);

const STROKES = ['intake', 'compression', 'power', 'exhaust'];
const strokeOf = (phaseDeg) => STROKES[Math.floor(mod(phaseDeg, 720) / 180)];

module.exports = { geometry, wallArea, makeLayout, layouts, cyclePhaseDeg, localCrankDeg, STROKES, strokeOf };
