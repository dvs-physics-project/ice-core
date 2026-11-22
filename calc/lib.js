/*
 * Общие помощники расчётных скриптов. Каждый скрипт пишет результаты в results/<имя>.json,
 * откуда их берут рисунки (figures/) и отчёт (report/).
 *
 *   Core                 — расчётное ядро (src/)
 *   round(x, digits)     — округление до digits знаков после запятой (число)
 *   comma(x, digits)     — то же строкой с десятичной запятой, для таблиц отчёта
 *   save(name, data)     — записать results/<name>.json
 *   simulationSpecs()    — описания трёх 3D-моделей (spec.js) из репозитория симуляции; путь — SIM_DIR,
 *                          по умолчанию ../ice-engine-simulation/js рядом с этим репозиторием
 *   DEFAULT_RPM, MAX_RPM — обороты, на которых модели открываются, и наибольшие обороты
 *   regimeFor(engine, rpm, params) — параметры режима: бензиновые — впуск по оборотам, дизель — наддув и α
 */
'use strict';
const fs = require('fs');
const path = require('path');
const Core = require('../src');

const ROOT = path.join(__dirname, '..');
const RESULTS = path.join(ROOT, 'results');
const SIM_DIR = process.env.SIM_DIR || path.join(ROOT, '..', 'ice-engine-simulation', 'js');

const round = (x, digits = 1) => +Number(x).toFixed(digits);
const comma = (x, digits = 1) => Number(x).toFixed(digits).replace('.', ',');

function save(name, data) {
  fs.mkdirSync(RESULTS, { recursive: true });
  fs.writeFileSync(path.join(RESULTS, `${name}.json`), JSON.stringify(data, null, 1));
  console.log(`results/${name}.json`);
}

function simulationSpecs() {
  if (!fs.existsSync(path.join(SIM_DIR, 'i4', 'spec.js'))) {
    throw new Error(`не найдены spec.js симуляции в ${SIM_DIR}: склонируйте ice-engine-simulation рядом или задайте SIM_DIR`);
  }
  const load = (id) => require(path.join(SIM_DIR, id, 'spec.js'));
  return { I4: load('i4'), B4: load('b4'), V8: load('v8') };
}

const DEFAULT_RPM = { I4: 2400, B4: 2400, V8: 1400 };
const MAX_RPM = { I4: 6500, B4: 6500, V8: 2600 };

const regimeFor = (engine, rpm, params = {}) =>
  (engine.fuel === 'diesel' ? Core.dieselSimParams(engine, params, rpm) : Core.regimeParams(engine, params, rpm));

module.exports = { Core, round, comma, save, simulationSpecs, DEFAULT_RPM, MAX_RPM, regimeFor, RESULTS, SIM_DIR };
