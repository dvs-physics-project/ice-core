/*
 * Двигатели 3D-симуляции и параметры дизеля.
 *
 * SIM_ENGINES — размеры двигателей, показанных в симуляции (те же, что в spec.js каждого двигателя симуляции):
 *   I4 — рядный бензиновый, B4 — оппозитный бензиновый, V8 — V-образный дизель с наддувом.
 *
 * DIESEL_PARAMS — рабочий процесс дизеля V8 (дополняют DEFAULT_PARAMS):
 *   Hu, l0       — теплота сгорания дизельного топлива и кг воздуха на 1 кг топлива
 *   n1, n2       — показатели политроп; lambdaZ, rhoZ — степени повышения давления и предварительного
 *                  расширения смешанного цикла
 *   pk, nk       — давление наддува и показатель политропы сжатия в компрессоре; pr — давление перед турбиной
 *   dT, Tr       — подогрев заряда и температура остаточных газов; xiZ, phiFull — как у бензиновых
 *   chi, wiebeA, wiebeM, burnDeg — закон Вибе; injStartDeg…injEndDeg — впрыск по углу цикла;
 *   ignDelayDeg  — задержка воспламенения; pmA, pmB — механические потери; mPiston, mRod, J — массы
 */
'use strict';

const SIM_ENGINES = Object.freeze({
  I4: Object.freeze({ name: 'I4 симуляции (КП.2011)', bore: 0.072, stroke: 0.069, rod: 0.122, cr: 10.5, cylinders: 4, fuel: 'petrol' }),
  B4: Object.freeze({ name: 'B4 симуляции', bore: 0.083, stroke: 0.083, rod: 0.1435, cr: 10, cylinders: 4, fuel: 'petrol' }),
  V8: Object.freeze({ name: 'V8-дизель симуляции (ДВС КР 09)', bore: 0.125, stroke: 0.13, rod: 0.25, cr: 17, cylinders: 8, fuel: 'diesel' }),
});

const DIESEL_PARAMS = Object.freeze({
  Hu: 42.5e6,
  l0: 14.45,
  n1: 1.36,
  n2: 1.27,
  lambdaZ: 1.45,
  rhoZ: 1.45,
  pk: 1.55e5,
  nk: 1.6,
  pr: 1.35e5,
  dT: 10,
  Tr: 800,
  xiZ: 0.85,
  phiFull: 0.95,
  chi: 0.97,
  wiebeA: 5,
  wiebeM: 0.6,
  injStartDeg: 344,
  injEndDeg: 368,
  ignDelayDeg: 6,
  burnDeg: 70,
  pmA: 0.089e6,
  pmB: 0.0118e6,
  mPiston: 3.2,
  mRod: 3.6,
  J: 3.5,
});

module.exports = { SIM_ENGINES, DIESEL_PARAMS };
