#!/usr/bin/env node
/*
 * Сборка src/ в один файл dist/ice-core.js без зависимостей (UMD):
 * в браузере — window.ICE_CORE, в Node — module.exports.
 * Этот файл копируется в репозиторий симуляции (js/ice-core.js).
 * Запуск: node tools/bundle.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');
const OUT = path.join(__dirname, '..', 'dist', 'ice-core.js');
const pkg = require('../package.json');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(path.join(dir, d.name)) : d.name.endsWith('.js') ? [path.join(dir, d.name)] : []);
}

const files = walk(SRC).sort();
const id = (f) => path.relative(SRC, f).replace(/\\/g, '/').replace(/\.js$/, '');
const modules = files.map((f) => {
  const code = fs.readFileSync(f, 'utf8').replace(/^'use strict';\n/m, '');
  return `  '${id(f)}': function (module, exports, require) {\n${code.replace(/^/gm, '    ').replace(/^ +$/gm, '')}\n  },`;
});

const out = `/*!
 * ice-core ${pkg.version} — расчётное ядро ДВС (собрано из src/ командой node tools/bundle.js).
 * Все величины в СИ: м, кг, с, Па, К, Дж, Н, Н·м, Вт, рад.
 * Браузер: window.ICE_CORE; Node: require('./ice-core.js').
 */
(function (root) {
'use strict';
const defs = {
${modules.join('\n')}
};
const cache = {};
function load(name) {
  if (cache[name]) return cache[name].exports;
  const module = (cache[name] = { exports: {} });
  const dir = name.includes('/') ? name.slice(0, name.lastIndexOf('/') + 1) : '';
  defs[name](module, module.exports, (rel) => load(resolve(dir, rel)));
  return module.exports;
}
function resolve(dir, rel) {
  const parts = (dir + rel).split('/');
  const outp = [];
  parts.forEach((p) => { if (p === '..') outp.pop(); else if (p !== '.' && p !== '') outp.push(p); });
  return outp.join('/');
}
const api = load('index');
if (typeof module !== 'undefined' && module.exports) module.exports = api;
root.ICE_CORE = api;
})(typeof window !== 'undefined' ? window : globalThis);
`;
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, out);
console.log(`dist/ice-core.js: ${files.length} модулей, ${out.split('\n').length} строк`);
