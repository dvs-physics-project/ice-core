/*
 * Блок 7. Газораспределение и приводы. Эталон — ВАЗ-21126 и двигатели симуляции.
 * Контрольные числа совпадают с отчётом. Запуск всех тестов: npm test
 */
'use strict';
const test = require('node:test');
const { Core, omega, near } = require('./helpers');


test('7. закон подъёма клапана: подъём, скорость и ускорение согласованы (численная производная)', () => {
  const omega = Core.omegaOf(6500), b = 75 * Core.DEG, H = 8e-3;
  const dt = 1e-7, ph = 70;
  const m0 = Core.valveMotion(H, b, 105, ph, omega);
  const dphi = (omega * dt) / Core.DEG;
  const m1 = Core.valveMotion(H, b, 105, ph + dphi, omega);
  near((m1.h - m0.h) / dt, m0.v, 1e-3);
  near(Core.valveMotion(H, b, 105, 105, omega).a, -4 * H * (omega / (2 * b)) ** 2, 1e-6);
});

test('7. фазы газораспределения I4: продолжительность 300°, при 1 мм — 241°', () => {
  const b = 75 * Core.DEG;
  near(Core.valveTiming(8e-3, b, 105).durationDeg, 300, 1e-9);
  near(Core.valveTiming(8e-3, b, 105, 1e-3).durationDeg, 241.2, 1e-3);
});

test('7. приводы: ремень I4 — 137 зубьев × 8 мм, распредвал вдвое медленнее вала', () => {
  near(Core.drives.beltLength(137, 8e-3), 1.096, 1e-12);
  near(Core.drives.ratio(23, 46), 0.5, 1e-12);
  near(Core.drives.centerDistance(4e-3, 24, 30), 0.108, 1e-12);
  near(Core.drives.gerotorOuterSpeed(6, 7, 7000), 6000, 1e-9);
});
