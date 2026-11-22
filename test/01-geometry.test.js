/*
 * Блок 1. Геометрия и компоновка. Эталон — ВАЗ-21126 и двигатели симуляции.
 * Контрольные числа совпадают с отчётом. Запуск всех тестов: npm test
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Core, vaz, near } = require('./helpers');


test('1. геометрия цилиндра', () => {
  const g = Core.geometry(vaz);
  near(g.F, 52.8102e-4, 1e-5, 'F');
  near(g.Vh, 399.245e-6, 1e-5, 'Vh');
  near(g.Vc, 39.9245e-6, 1e-5, 'Vc');
  near(g.Va, 439.169e-6, 1e-5, 'Va');
  near(g.Vtotal, 1596.98e-6, 1e-5, 'Vл');
  near(g.lambda, 0.28351, 1e-4, 'λ');
  near(g.hc, 7.56e-3, 1e-4, 'hc');
});

test('1. числа команды отличаются от точных не больше чем на 0,1 %', () => {
  const g = Core.geometry(vaz);
  near(g.F, 0.00527834, 1e-3);
  near(g.Vh, 0.000399, 1e-3);
  near(g.Vc, 0.0000399, 1e-3);
  near(g.Va, 0.0004389, 1e-3);
});

test('1. компоновки: углы колен выводятся из порядка работы', () => {
  assert.deepEqual(Core.layouts.inline4().cylinders.map((c) => c.throwDeg), [0, 180, 180, 0]);
  assert.deepEqual(Core.layouts.boxer4().cylinders.map((c) => c.throwDeg), [-90, 90, 90, -90]);
  assert.deepEqual(
    Core.layouts.vee8().cylinders.map((c) => c.throwDeg),
    [-45, 45, -135, 135, -45, 45, -135, 135]
  );
  const r5 = Core.layouts.radial(5);
  assert.equal(r5.intervalDeg, 144);
  assert.deepEqual(r5.firingOrder, [1, 3, 5, 2, 4]);
  r5.cylinders.forEach((c) => near(c.throwDeg, 0, 1, 'одна шейка на всю звезду'));
  assert.throws(() => Core.layouts.radial(6));
});

test('1. фазы I4 при θ = 100°: рабочий ход, выпуск, сжатие, впуск', () => {
  const L = Core.layouts.inline4();
  assert.deepEqual([0, 1, 2, 3].map((j) => Core.cyclePhaseDeg(L, j, 100)), [460, 640, 280, 100]);
  assert.deepEqual(
    [0, 1, 2, 3].map((j) => Core.strokeOf(Core.cyclePhaseDeg(L, j, 100))),
    ['power', 'exhaust', 'compression', 'intake']
  );
});

test('1. согласование механики и цикла: α_j ≡ Φ_j (mod 360°) для всех компоновок', () => {
  for (const L of [Core.layouts.inline4(), Core.layouts.vee8(), Core.layouts.boxer4(), Core.layouts.radial(5), Core.layouts.radial(9)]) {
    for (const th of [0, 37, 250.5, 613]) {
      L.cylinders.forEach((_, j) => {
        const d = (Core.localCrankDeg(L, j, th) - Core.cyclePhaseDeg(L, j, th)) % 360;
        assert.ok(Math.abs(((d + 540) % 360) - 180) < 1e-9);
      });
    }
  }
});
