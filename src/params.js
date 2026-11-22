/*
 * Эталонный двигатель ВАЗ-21126 и параметры рабочего процесса по умолчанию.
 *
 * Описание двигателя: bore (D, м), stroke (S, м), rod (L, м), cr (ε), cylinders (i).
 *
 * DEFAULT_PARAMS — исходные данные команды и принятые величины, СИ:
 *   впуск:        pa, Ta — давление и температура в конце впуска; p0, T0 — окружающая среда;
 *                 dT — подогрев свежего заряда; pr, Tr — давление и температура остаточных газов
 *   рабочее тело: Rgas — газовая постоянная воздуха; k — показатель адиабаты (идеальный цикл);
 *                 Hu — низшая теплота сгорания бензина; l0 — кг воздуха на 1 кг топлива; alphaAir — α
 *   цикл ур. 1:   n1, n2 — показатели политроп сжатия и расширения; xiZ — коэффициент использования
 *                 теплоты; phiFull — коэффициент полноты диаграммы
 *   теплоёмкость: c_v(T) = A + B·T для свежей смеси (cvFreshA, cvFreshB) и продуктов (cvBurnedA, cvBurnedB);
 *                 Tref — начало отсчёта внутренней энергии
 *   цикл ур. 2:   chi — полнота сгорания; wiebeA, wiebeM — параметры закона Вибе; sparkDeg — начало
 *                 сгорания по углу цикла (340° = 20° до ВМТ); burnDeg — продолжительность; Tw — стенка
 *   потери:       p_м = pmA + pmB·v_п.ср
 *   массы:        mPiston — поршень с пальцем (235 + 65 г), mRod — шатун (485 г), rodSplit — доля шатуна,
 *                 отнесённая к поршню; pCrankcase — давление в картере; J — момент инерции вала с маховиком
 *
 *   withDefaults(params) — параметры по умолчанию, поверх которых записаны переданные
 */
'use strict';
const { R_UNIV } = require('./util');

const VAZ21126 = Object.freeze({
  name: 'ВАЗ-21126',
  bore: 0.082,
  stroke: 0.0756,
  rod: 0.13333,
  cr: 11,
  cylinders: 4,
});

const DEFAULT_PARAMS = Object.freeze({
  pa: 85000,
  Ta: 340,
  Rgas: R_UNIV / 0.029,
  k: 1.4,
  Hu: 44e6,
  l0: 14.7,
  alphaAir: 1,
  p0: 101325,
  T0: 293,
  dT: 20,
  pr: 115000,
  Tr: 1000,
  n1: 1.38,
  n2: 1.3,
  xiZ: 0.9,
  phiFull: 0.96,
  cvFreshA: 635,
  cvFreshB: 0.242,
  cvBurnedA: 900,
  cvBurnedB: 0.105,
  Tref: 293,
  chi: 0.95,
  wiebeA: 5,
  wiebeM: 2,
  sparkDeg: 340,
  burnDeg: 55,
  Tw: 450,
  pmA: 0.034e6,
  pmB: 0.0113e6,
  mPiston: 0.3,
  mRod: 0.485,
  rodSplit: 0.275,
  pCrankcase: 1e5,
  J: 0.13,
});

const withDefaults = (params) => Object.assign({}, DEFAULT_PARAMS, params || {});

module.exports = { VAZ21126, DEFAULT_PARAMS, withDefaults };
