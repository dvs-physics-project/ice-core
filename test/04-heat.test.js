/*
 * Блок 4. Теплообмен и тепловой баланс. Эталон — ВАЗ-21126 и двигатели симуляции.
 * Контрольные числа совпадают с отчётом. Запуск всех тестов: npm test
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Core, vaz, near } = require('./helpers');


test('4. площадь теплообмена', () => {
  near(Core.wallArea(vaz, 0), 125.1e-4, 1e-3);
  near(Core.wallArea(vaz, vaz.stroke), 319.85e-4, 1e-3);
});

test('4. тепловой баланс замкнут, КПД в разумных пределах', () => {
  const s = Core.simulateCycle(vaz);
  const hb = Core.heatBalance(vaz, s);
  near(hb.Qe + hb.Qm + hb.Qw + hb.Qgas + hb.Qinc, hb.Qfuel, 1e-10);
  near(hb.etaI, 0.3787, 5e-3, 'η_i');
  near(hb.etaE, 0.332, 1e-2, 'η_e');
  assert.ok(hb.shares.walls > 0.1 && hb.shares.walls < 0.25);
});
