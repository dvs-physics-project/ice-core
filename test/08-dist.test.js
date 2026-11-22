/*
 * Собранный файл dist/ice-core.js (его использует симуляция) даёт те же результаты, что и src/.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Source = require('../src');
const Bundle = require('../dist/ice-core.js');

test('dist: тот же набор функций, что в src', () => {
  assert.deepEqual(Object.keys(Bundle).sort(), Object.keys(Source).sort());
});

test('dist: пошаговый расчёт ВАЗ-21126 и дизеля V8 совпадает с src', () => {
  const a = Source.simulateCycle(Source.VAZ21126, {}, { rpm: 3000 }), b = Bundle.simulateCycle(Bundle.VAZ21126, {}, { rpm: 3000 });
  assert.equal(a.Li, b.Li); assert.equal(a.pmax, b.pmax);
  const pa = Source.dieselSimParams(Source.SIM_ENGINES.V8, {}, 1400), pb = Bundle.dieselSimParams(Bundle.SIM_ENGINES.V8, {}, 1400);
  assert.equal(Source.simulateCycle(Source.SIM_ENGINES.V8, pa, { rpm: 1400 }).Li, Bundle.simulateCycle(Bundle.SIM_ENGINES.V8, pb, { rpm: 1400 }).Li);
});
