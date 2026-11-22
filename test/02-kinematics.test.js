/*
 * Блок 2. Кинематика КШМ. Эталон — ВАЗ-21126 и двигатели симуляции.
 * Контрольные числа совпадают с отчётом. Запуск всех тестов: npm test
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Core, vaz, DEG, omega, near } = require('./helpers');


test('2. кинематика при α = 60°', () => {
  const k = Core.kinematics(vaz, 60 * DEG, omega);
  near(k.beta / DEG, 14.213, 1e-4, 'β');
  near(k.y, 0.148149, 1e-5, 'y');
  near(k.x, 0.022981, 1e-4, 'x');
  near(k.V, 161.29e-6, 1e-4, 'V');
  near(k.v, 11.788, 1e-4, 'v');
  near(k.a, 1337.3, 1e-4, 'a');
});

test('2. мёртвые точки', () => {
  const g = Core.geometry(vaz);
  near(Core.kinematics(vaz, 0, omega).y, vaz.rod + g.R, 1e-12);
  near(Core.kinematics(vaz, Math.PI, omega).x, vaz.stroke, 1e-12);
  near(Core.kinematics(vaz, 0, omega).a, g.R * omega * omega * (1 + g.lambda), 1e-12);
  near(Core.kinematics(vaz, Math.PI, omega).a, -g.R * omega * omega * (1 - g.lambda), 1e-12);
  near(Core.kinematics(vaz, 0, omega).a, 4788.4, 1e-4);
});

test('2. v и a — производные x по времени (численная проверка)', () => {
  const h = 1e-6;
  for (const deg of [10, 75, 140, 200, 330]) {
    const al = deg * DEG;
    const k = Core.kinematics(vaz, al, omega);
    const dx = (Core.kinematics(vaz, al + h, omega).x - Core.kinematics(vaz, al - h, omega).x) / (2 * h);
    const dv = (Core.kinematics(vaz, al + h, omega).v - Core.kinematics(vaz, al - h, omega).v) / (2 * h);
    near(k.v, dx * omega, 1e-6, 'v');
    near(k.a, dv * omega, 1e-5, 'a');
  }
});

test('2. погрешность приближённой формулы x не больше Rλ³/8', () => {
  const g = Core.geometry(vaz);
  const bound = (g.R * g.lambda ** 3) / 8;
  let worst = 0;
  for (let deg = 0; deg <= 360; deg += 1) {
    worst = Math.max(worst, Math.abs(Core.kinematicsApprox(vaz, deg * DEG).x - Core.kinematics(vaz, deg * DEG).x));
  }
  assert.ok(worst <= bound * 1.05 && worst > bound * 0.9, `${worst} против ${bound}`);
  near(bound, 0.1077e-3, 1e-3);
});

test('2. максимум скорости 12,35 м/с при α ≈ 75,2°', () => {
  let vmax = 0;
  let at = 0;
  for (let deg = 0; deg <= 180; deg += 0.01) {
    const v = Core.kinematics(vaz, deg * DEG, omega).v;
    if (v > vmax) [vmax, at] = [v, deg];
  }
  near(vmax, 12.346, 1e-4);
  near(at, 75.23, 1e-3);
  near(Core.meanPistonSpeed(vaz, 3000), 7.56, 1e-12);
});
