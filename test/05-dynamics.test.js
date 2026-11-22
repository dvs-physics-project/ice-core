/*
 * Блок 5. Динамика и показатели двигателя. Эталон — ВАЗ-21126 и двигатели симуляции.
 * Контрольные числа совпадают с отчётом. Запуск всех тестов: npm test
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Core, vaz, DEG, omega, near } = require('./helpers');


test('5. силы в КШМ при Φ = 380° (α = 20° после ВМТ)', () => {
  const s = Core.simulateCycle(vaz);
  const F = Core.forces(vaz, {}, s.state(380).p, 20 * DEG, omega);
  near(F.Fj, -1875.9, 1e-3, 'F_ин');
  near(F.Fsum, F.Fg + F.Fj, 1e-12);
  near(F.FN, F.Fsum * Math.tan(Core.kinematics(vaz, 20 * DEG).beta), 1e-12);
  near(F.torque, F.Ftau * Core.geometry(vaz).R, 1e-12);
  near(F.Fg, 25463, 5e-3, 'F_г');
  near(F.torque, 386.7, 5e-3, 'M_ц');
});

test('5. средний момент кривой M(θ) равен работе цикла: M = (L_i + L_нас)·i/(4π)', () => {
  const s = Core.simulateCycle(vaz);
  const tc = Core.torqueCurve(vaz, Core.layouts.inline4(), s.state, {}, 3000, 1);
  near(tc.mean, (s.LiNet * vaz.cylinders) / (4 * Math.PI), 2e-3);
  near(tc.mean, 120.1, 5e-3);
});

test('5. силы инерции не меняют средний момент', () => {
  const s = Core.simulateCycle(vaz);
  const a = Core.torqueCurve(vaz, Core.layouts.inline4(), s.state, {}, 3000, 1).mean;
  const b = Core.torqueCurve(vaz, Core.layouts.inline4(), s.state, { mPiston: 0, mRod: 0 }, 3000, 1).mean;
  near(a, b, 2e-3);
});

test('5. уравновешенность: I4, оппозит, V8 и звезда', () => {
  const P = Core.DEFAULT_PARAMS;
  const g = Core.geometry(vaz);
  const A = Core.reciprocatingMass(P) * g.R * omega * omega;
  const abs = (v) => Math.hypot(v[0], v[1]);
  for (const th of [0, 17, 90, 222]) {
    const i4 = Core.inertiaResultant(vaz, Core.layouts.inline4(), {}, th, omega);
    assert.ok(abs(i4.F1) < 1e-6);
    near(i4.F2[0], -4 * A * g.lambda * Math.cos(2 * th * DEG), 1e-9);
    assert.ok(abs(Core.inertiaResultant(vaz, Core.layouts.boxer4(), {}, th, omega).F1) < 1e-6);
    assert.ok(abs(Core.inertiaResultant(vaz, Core.layouts.boxer4(), {}, th, omega).F2) < 1e-6);
    assert.ok(abs(Core.inertiaResultant(vaz, Core.layouts.vee8(), {}, th, omega).F1) < 1e-6);
    near(abs(Core.inertiaResultant(vaz, Core.layouts.radial(5), {}, th, omega).F1), 2.5 * A, 1e-9);
  }
});

test('5. показатели двигателя при 3000 об/мин', () => {
  const s = Core.simulateCycle(vaz);
  const p = Core.performance(vaz, s.Li, 3000);
  near(p.pm, 0.11943e6, 1e-4, 'p_м');
  near(p.Ne, 34.17e3, 5e-3, 'N_e');
  near(p.Me, 108.8, 5e-3, 'M_e');
  near(p.Ne, p.Me * omega, 1e-12);
});
