#!/usr/bin/env node
/*
 * Выполняет все расчёты по порядку разделов отчёта и записывает results/*.json.
 * Запуск: npm run calc   (SIM_DIR — путь к js/ репозитория симуляции)
 */
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const scripts = fs.readdirSync(__dirname).filter((f) => /^\d\d-.*\.js$/.test(f)).sort();
const t0 = Date.now();
for (const s of scripts) {
  process.stdout.write(`${s.padEnd(26)} → `);
  execFileSync(process.execPath, [path.join(__dirname, s)], { stdio: 'inherit' });
}
console.log(`\n${scripts.length} расчётов за ${((Date.now() - t0) / 1000).toFixed(1)} с`);
