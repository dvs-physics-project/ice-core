/*
 * Раздел 11 отчёта. Внешняя скоростная характеристика ВАЗ-21126 (пошаговый расчёт на каждом режиме).
 *   vazChar     — показатели по оборотам и мощность по формуле Лейдермана;
 *   check       — сравнение с паспортом (72 кВт при 5600 об/мин, 145 Н·м при 4000 об/мин): гипотеза
 *                 проекта подтверждается, если расхождение не больше 20 %;
 *   sensitivity — как меняется момент при 3000 об/мин, если сдвинуть одно допущение. Для продолжительности
 *                 сгорания начало сдвигается так, чтобы середина сгорания (x = 0,5) осталась на месте.
 */
'use strict';
const { Core, round, save } = require('./lib');

const PASSPORT = { Ne: 72, nN: 5600, Me: 145, nM: 4000 };
const HYPOTHESIS_LIMIT_PERCENT = 20;
const vaz = Object.assign({}, Core.VAZ21126, { fuel: 'petrol' });
const rpms = [1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5600, 6000];

const vazChar = Core.speedCharacteristic(vaz, {}, rpms).map((point) => ({
  rpm: point.rpm, pa: round(point.pa / 1e3, 1), Ta: round(point.Ta, 1), etaV: round(point.etaV, 3), pmax: round(point.pmax / 1e5, 1),
  pe: round(point.pe / 1e5, 2), Ne: round(point.Ne / 1e3, 1), Me: round(point.Me, 1), etaE: round(point.etaE, 3), ge: round(point.ge, 0),
  leid: round(Core.leidermanPower(PASSPORT.Ne, PASSPORT.nN, point.rpm), 1),
}));
const atRpm = (rpm) => vazChar.find((point) => point.rpm === rpm);
const maxTorque = vazChar.reduce((best, point) => (point.Me > best.Me ? point : best));
const check = {
  NeAtNominal: atRpm(PASSPORT.nN).Ne, NeErr: round((atRpm(PASSPORT.nN).Ne / PASSPORT.Ne - 1) * 100, 1),
  MeAt4000: atRpm(PASSPORT.nM).Me, MeErr: round((atRpm(PASSPORT.nM).Me / PASSPORT.Me - 1) * 100, 1),
  MeMax: maxTorque.Me, MeMaxAt: maxTorque.rpm, hypothesisLimit: HYPOTHESIS_LIMIT_PERCENT,
};
check.hypothesis = Math.abs(check.NeErr) <= HYPOTHESIS_LIMIT_PERCENT && Math.abs(check.MeErr) <= HYPOTHESIS_LIMIT_PERCENT;

const engine = Core.VAZ21126, rpm = 3000, base = Core.DEFAULT_PARAMS;
const torqueLevel2 = (params) => Core.performance(engine, Core.simulateCycle(engine, params, { rpm, stepDeg: 0.5 }).Li, rpm, params).Me;
const torqueLevel1 = (params) => Core.performance(engine, Core.calcCycle(engine, params).Li, rpm, params).Me;
const baseLevel2 = torqueLevel2({}), baseLevel1 = torqueLevel1({});
const percent = (value, reference) => round((value / reference - 1) * 100, 1);
const halfBurnShare = Math.pow(Math.log(2) / base.wiebeA, 1 / (base.wiebeM + 1));

const sensitivity = [
  { name: 'pa', base: '85 кПа', change: '+5 кПа', d: [percent(torqueLevel2({ pa: base.pa + 5000 }), baseLevel2)] },
  { name: 'Ta', base: '340 К', change: '–20 К', d: [percent(torqueLevel2({ Ta: base.Ta - 20 }), baseLevel2)] },
  { name: 'chi', base: '0,95', change: '0,90', d: [percent(torqueLevel2({ chi: 0.9 }), baseLevel2)] },
  {
    name: 'burnDeg', base: '55°', change: '45° (середина сгорания та же)',
    d: [percent(torqueLevel2({ burnDeg: 45, sparkDeg: base.sparkDeg + (base.burnDeg - 45) * halfBurnShare }), baseLevel2)],
  },
  { name: 'Tw', base: '450 К', change: '500 К', d: [percent(torqueLevel2({ Tw: 500 }), baseLevel2)] },
  { name: 'pmB', base: '0,0113', change: '+20 %', d: [percent(torqueLevel2({ pmB: base.pmB * 1.2 }), baseLevel2)] },
  { name: 'n2', base: '1,30', change: '1,25 / 1,34', d: [percent(torqueLevel1({ n2: 1.25 }), baseLevel1), percent(torqueLevel1({ n2: 1.34 }), baseLevel1)] },
  { name: 'xiZ', base: '0,90', change: '0,85 / 0,95', d: [percent(torqueLevel1({ xiZ: 0.85 }), baseLevel1), percent(torqueLevel1({ xiZ: 0.95 }), baseLevel1)] },
];

save('characteristics', { passport: PASSPORT, vazChar, check, sensitivity, base: { Me2: round(baseLevel2, 1), Me1: round(baseLevel1, 1) } });
