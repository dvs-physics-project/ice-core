/*
 * Блок 6. Газообмен по оборотам, дизель и наддув. Эталон — ВАЗ-21126 и двигатели симуляции.
 * Контрольные числа совпадают с отчётом. Запуск всех тестов: npm test
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Core, vaz, near } = require('./helpers');


test('6. потери на впуске: на номинальном режиме ВАЗ давление совпадает с числом команды', () => {
  const s = Core.intakeState(Core.VAZ21126, {}, 5600);
  near(s.pa, 85600, 0.01);
  near(Core.intakeState(Core.VAZ21126, {}, 3000).pa, 96800, 0.005);
});

test('6. α ≥ 1: продукты сгорания разбавляются воздухом, при α = 1 ничего не меняется', () => {
  const P = Object.assign({}, Core.DEFAULT_PARAMS);
  assert.equal(Core.fStoich(P), 1);
  const P2 = Object.assign({}, P, { alphaAir: 2 });
  const a = Core.cvBurned(P, 1500), b = Core.cvFresh(P, 1500), c = Core.cvBurned(P2, 1500);
  assert.ok(c > Math.min(a, b) && c < Math.max(a, b));
});

test('6. дизель V8: смешанный цикл даёт реалистичный коэффициент избытка воздуха', () => {
  const vaz = Core.SIM_ENGINES.V8;
  const P = Core.regimeParams(vaz, Core.DIESEL_PARAMS, 1400);
  const c = Core.dieselCycle(vaz, P);
  near(c.pz / c.pc, 1.45, 1e-9);
  assert.ok(c.alpha > 1.4 && c.alpha < 2.2, `α = ${c.alpha}`);
  assert.ok(c.etaI > 0.38 && c.etaI < 0.5);
});

test('6. дизель V8: пошаговый расчёт сходится по энергии', () => {
  const vaz = Core.SIM_ENGINES.V8;
  const s = Core.simulateCycle(vaz, Core.dieselSimParams(vaz, {}, 1400), { rpm: 1400, stepDeg: 0.5 });
  assert.ok(Math.abs(s.energyResidual) < 0.1);
  assert.ok(s.pmax / 1e5 > 80 && s.pmax / 1e5 < 140);
});

test('6. компрессор: температура наддува симуляции 345 К соответствует n_к = 1,6', () => {
  const k = Core.compressor(Object.assign({}, Core.DEFAULT_PARAMS, Core.DIESEL_PARAMS), 1);
  near(k.Tk, 343.6, 0.002);
  assert.ok(k.etaAd > 0.7 && k.etaAd < 0.8);
});

test('6. скоростная характеристика ВАЗ: мощность растёт до номинала, момент падает после максимума', () => {
  const r = Core.speedCharacteristic(Object.assign({}, Core.VAZ21126, { fuel: 'petrol' }), {}, [2000, 4000, 5600]);
  assert.ok(r[2].Ne > r[1].Ne && r[1].Ne > r[0].Ne);
  assert.ok(r[0].Me > r[2].Me);
});
