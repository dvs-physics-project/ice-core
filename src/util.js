/*
 * Общие константы.
 *
 *   DEG          — радиан в одном градусе
 *   R_UNIV       — универсальная газовая постоянная, Дж/(моль·К)
 *   mod(a, m)    — остаток от деления, всегда неотрицательный (для углов цикла 0…720°)
 */
'use strict';

const DEG = Math.PI / 180;
const R_UNIV = 8.314;
const mod = (a, m) => ((a % m) + m) % m;

module.exports = { DEG, R_UNIV, mod };
