/*
 * Свойства рабочего тела (формула 3.7): теплоёмкость c_v(T) = A + B·T и внутренняя энергия.
 * x — массовая доля продуктов сгорания (0 — свежая смесь, 1 — продукты). Внутренняя энергия отсчитывается
 * от Tref, чтобы теплота сгорания Hu, определённая при Tref, входила в баланс без поправок.
 * При α > 1 продукты сгорания — смесь стехиометрических продуктов и избыточного воздуха.
 *
 *   cvFresh(params, T), cvBurned(params, T), cv(params, T, x)       — теплоёмкость, Дж/(кг·К)
 *   uFresh(params, T), uBurned(params, T), uInt(params, T, x)       — внутренняя энергия, Дж/кг
 *   uBurnedStoich(params, T)                                         — энергия стехиометрических продуктов
 *   fStoich(params)                                                  — доля стехиометрических продуктов
 */
'use strict';

const cvFresh = (params, T) => params.cvFreshA + params.cvFreshB * T;
const fStoich = (params) => (params.alphaAir > 1 ? (1 + params.l0) / (1 + params.alphaAir * params.l0) : 1);

function cvBurned(params, T) {
  const share = fStoich(params);
  return share * (params.cvBurnedA + params.cvBurnedB * T) + (1 - share) * cvFresh(params, T);
}

const cv = (params, T, x = 0) => (1 - x) * cvFresh(params, T) + x * cvBurned(params, T);

const uFresh = (params, T) => params.cvFreshA * (T - params.Tref) + (params.cvFreshB / 2) * (T * T - params.Tref * params.Tref);
const uBurnedStoich = (params, T) => params.cvBurnedA * (T - params.Tref) + (params.cvBurnedB / 2) * (T * T - params.Tref * params.Tref);

function uBurned(params, T) {
  const share = fStoich(params);
  return share * uBurnedStoich(params, T) + (1 - share) * uFresh(params, T);
}

const uInt = (params, T, x = 0) => (1 - x) * uFresh(params, T) + x * uBurned(params, T);

module.exports = { cvFresh, fStoich, cvBurned, cv, uFresh, uBurnedStoich, uBurned, uInt };
