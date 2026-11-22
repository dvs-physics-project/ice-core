/*
 * Раздел 3 отчёта. Геометрия цилиндров ВАЗ-21126 и трёх двигателей симуляции,
 * углы колен четырёх компоновок по порядку работы.
 * F_п = πD²/4, V_h = F_п·S, V_c = V_h/(ε − 1), λ = R/L.
 */
'use strict';
const { Core, round, save } = require('./lib');

function geometryRow(engine) {
  const geom = Core.geometry(engine);
  return {
    name: engine.name, D: round(engine.bore * 1e3, 1), S: round(engine.stroke * 1e3, 2), L: round(engine.rod * 1e3, 2),
    cr: engine.cr, i: engine.cylinders,
    F: round(geom.F * 1e4, 2), Vh: round(geom.Vh * 1e6, 2), Vl: round(geom.Vtotal * 1e6, 0), Vc: round(geom.Vc * 1e6, 2),
    Va: round(geom.Va * 1e6, 2), R: round(geom.R * 1e3, 2), lam: round(geom.lambda, 4), SD: round(engine.stroke / engine.bore, 3),
  };
}

function layoutRow(layout) {
  return {
    interval: layout.intervalDeg,
    order: layout.firingOrder,
    cylinders: layout.cylinders.map((cylinder) => ({
      n: cylinder.n, axis: cylinder.axisDeg, fireAt: cylinder.fireAtDeg, throw: round(cylinder.throwDeg, 1),
    })),
  };
}

const layouts = {
  inline4: Core.layouts.inline4(),
  boxer4: Core.layouts.boxer4(),
  vee8: Core.layouts.vee8(90),
  radial5: Core.layouts.radial(5),
};

save('geometry', {
  vaz: geometryRow(Core.VAZ21126),
  sim: Object.fromEntries(Object.entries(Core.SIM_ENGINES).map(([key, engine]) => [key, geometryRow(engine)])),
  layouts: Object.fromEntries(Object.entries(layouts).map(([key, layout]) => [key, layoutRow(layout)])),
});
