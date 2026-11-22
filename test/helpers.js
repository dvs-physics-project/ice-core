/*
 * Общее для всех тестов: ядро, эталонный двигатель ВАЗ-21126, ω при 3000 об/мин и сравнение чисел.
 *
 *   near(actual, expected, tolerance, message) — |actual − expected| ≤ tolerance·|expected|
 *                                                (по умолчанию 0,1 %); в сообщении — оба числа
 */
'use strict';
const assert = require('node:assert/strict');
const Core = require('../src');

const near = (actual, expected, tolerance = 1e-3, message = '') =>
  assert.ok(Math.abs(actual - expected) <= tolerance * Math.abs(expected) + 1e-12, `${message} получено ${actual}, ожидалось ${expected}`);

module.exports = { Core, vaz: Core.VAZ21126, DEG: Core.DEG, omega: Core.omegaOf(3000), near };
