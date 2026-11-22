/*
 * Блок 3. Термодинамика: уровни 0, 1, 2. Эталон — ВАЗ-21126 и двигатели симуляции.
 * Контрольные числа совпадают с отчётом. Запуск всех тестов: npm test
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Core, vaz, near } = require('./helpers');


test('3. идеальный цикл Отто (расчёт команды)', () => {
  const o = Core.ottoIdeal(vaz);
  near(o.m, 382.97e-6, 1e-4, 'm');
  near(o.points[1].p, 24.399e5, 1e-4, 'p2');
  near(o.points[1].T, 887.2, 1e-4, 'T2');
  near(o.points[2].T, 4797.4, 1e-4, 'T3');
  near(o.points[2].p, 131.93e5, 1e-4, 'p3');
  near(o.points[3].p, 4.596e5, 1e-3, 'p4');
  near(o.points[3].T, 1838.5, 1e-4, 'T4');
  near(o.etaT, 0.6168, 1e-4, 'η_t');
  near(o.work, 662.0, 1e-4, 'L_t');
});

test('3. работа идеального цикла: η_t·Q1 совпадает с интегралом p dV', () => {
  const o = Core.ottoIdeal(vaz);
  const [p1, p2, p3, p4] = o.points;
  const k = Core.DEFAULT_PARAMS.k;
  const W = (p3.p * p3.V - p4.p * p4.V) / (k - 1) - (p2.p * p2.V - p1.p * p1.V) / (k - 1);
  near(W, o.work, 1e-10);
});

test('3. заряд цилиндра', () => {
  const ch = Core.charge(vaz);
  near(ch.gammaR, 0.0439, 2e-3, 'γ_r');
  near(ch.mFuel, 23.367e-6, 1e-4, 'm_т');
  near(ch.Qfuel, 1028.1, 1e-4, 'Q_т');
  near(ch.etaV, 0.7618, 1e-3, 'η_v');
});

test('3. расчётный цикл (уровень 1)', () => {
  const c = Core.calcCycle(vaz);
  near(c.pc, 23.26e5, 1e-3, 'p_c');
  near(c.Tc, 845.7, 1e-4, 'T_c');
  near(c.Tz, 2950, 1e-3, 'T_z');
  near(c.pz, 81.12e5, 1e-3, 'p_z');
  near(c.pb, 3.592e5, 1e-3, 'p_b');
  near(c.Tb, 1437, 1e-3, 'T_b');
  near(c.LiTheor, 407.6, 1e-3, "L_i'");
  near(c.Li, 391.3, 1e-3, 'L_i');
  near(c.etaI, 0.3806, 1e-3, 'η_i');
});

test('3. уравнение сгорания выполняется: ξ_z·Q_т/m + u_см(T_c) = u_пс(T_z)', () => {
  const P = Core.DEFAULT_PARAMS;
  const c = Core.calcCycle(vaz);
  near((P.xiZ * c.Qfuel) / c.m + Core.uFresh(P, c.Tc), Core.uBurned(P, c.Tz), 1e-10);
});

test('3. состояние по углу непрерывно в НМТ и на границах тактов', () => {
  const c = Core.calcCycle(vaz);
  near(Core.cycleState(vaz, c, 180).p, c.pa, 1e-9);
  near(Core.cycleState(vaz, c, 359.999).p, c.pc, 1e-4);
  near(Core.cycleState(vaz, c, 360).p, c.pz, 1e-9);
  near(Core.cycleState(vaz, c, 539.999).p, c.pb, 1e-4);
});

test('3. закон Вибе: 50 % топлива сгорает к 8,5° после ВМТ', () => {
  const P = Core.DEFAULT_PARAMS;
  assert.equal(Core.wiebe(339, P).x, 0);
  near(Core.wiebe(368.46, P).x, 0.5, 2e-3);
  near(Core.wiebe(380, P).x, 0.854, 2e-3);
  near(Core.wiebe(400, P).x, 1 - Math.exp(-5), 1e-12);
});

test('3. пошаговый расчёт (уровень 2): контрольные числа и баланс энергии', () => {
  const s = Core.simulateCycle(vaz, {}, { rpm: 3000, stepDeg: 0.5 });
  near(s.pmax, 52.7e5, 5e-3, 'p_max');
  near(s.phaseAtPmax, 373.5, 3e-3, 'Φ(p_max)');
  near(s.Tmax, 2526, 5e-3, 'T_max');
  near(s.Li, 389.4, 3e-3, 'L_i');
  near(s.Qw, 160.2, 5e-3, 'Q_w');
  assert.ok(Math.abs(s.energyResidual) < 0.05, `невязка ${s.energyResidual} Дж`);
});

test('3. сходимость по шагу: 1° и 0,25° дают одну работу с точностью 0,05 %', () => {
  const a = Core.simulateCycle(vaz, {}, { rpm: 3000, stepDeg: 1 }).Li;
  const b = Core.simulateCycle(vaz, {}, { rpm: 3000, stepDeg: 0.25 }).Li;
  near(a, b, 5e-4);
});

test('3. уровни 1 и 2 согласованы: работа цикла расходится меньше чем на 2 %', () => {
  near(Core.calcCycle(vaz).Li, Core.simulateCycle(vaz).Li, 0.02);
});
