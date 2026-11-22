/*
 * Раздел 8 отчёта. Теплообмен и тепловой баланс ВАЗ-21126 при 3000 об/мин.
 *   balance     — теплота топлива: работа, стенки, отработавшие газы (по энтальпии продуктов при T_r),
 *                 недогорание, механические потери и остаток;
 *   woschni380  — пример теплоотдачи по Вошни при Φ = 380° (20° после ВМТ);
 *   wall        — средний поток в стенки (площадь стенок осреднена за оборот) и температуры гильзы;
 *   efficiency  — КПД η_i, η_м, η_e и удельный расход топлива.
 */
'use strict';
const { Core, round, save } = require('./lib');

const engine = Core.VAZ21126, params = Object.assign({}, Core.DEFAULT_PARAMS), rpm = 3000, DEG = Core.DEG;
const sim = Core.simulateCycle(engine, params, { rpm, stepDeg: 0.5 });
const balance = Core.heatBalance(engine, sim, params);
const productsEnthalpy = (T) => Core.uBurned(params, T) + params.Rgas * (T - params.Tref);
const exhaustHeat = sim.mFresh * productsEnthalpy(sim.Tr);
const remainder = sim.Qfuel - balance.Qe - sim.Qw - exhaustHeat - balance.Qinc;

const phase = 380;
const gas = sim.state(phase);
const piston = Core.kinematics(engine, (phase % 360) * DEG, Core.omegaOf(rpm));
const heatTransfer = Core.woschni(engine, params, { p: gas.p, T: gas.T, V: gas.V, phaseDeg: phase, vp: Core.meanPistonSpeed(engine, rpm) });
const wallArea = Core.wallArea(engine, piston.x);

let areaSum = 0;
for (let degrees = 0; degrees < 360; degrees += 1) areaSum += Core.wallArea(engine, Core.kinematics(engine, degrees * DEG).x);
const meanArea = areaSum / 360, cycleTime = 120 / rpm, meanFlux = sim.Qw / (meanArea * cycleTime);
const wall = Core.wallTemperatures(meanFlux, { Tcoolant: 363, hCoolant: 8000, thickness: 0.007, conductivity: 50 });

save('heat', {
  balance: {
    Qt: round(sim.Qfuel, 1), Qe: round(balance.Qe, 1), Qw: round(sim.Qw, 1), Qg: round(exhaustHeat, 1), Qnc: round(balance.Qinc, 1),
    Qm: round(balance.Qm, 1), Qrest: round(remainder, 1), Tr: round(sim.Tr, 1), hTr: round(productsEnthalpy(sim.Tr) / 1e3, 1),
    mFresh: round(sim.mFresh * 1e6, 2),
  },
  woschni380: {
    p: round(gas.p / 1e5, 2), T: round(gas.T, 0), pMot: round(heatTransfer.pMot / 1e5, 2), w: round(heatTransfer.w, 2), h: round(heatTransfer.h, 0),
    Aw: round(wallArea * 1e4, 1), Qdot: round(heatTransfer.h * wallArea * (gas.T - params.Tw) / 1e3, 1),
  },
  wall: { AmeanCm2: round(meanArea * 1e4, 1), qMeanKWm2: round(meanFlux / 1e3, 0), TwCoolant: round(wall.TwCoolant, 0), TwGas: round(wall.TwGas, 0) },
  efficiency: {
    etaI: round(sim.etaI, 3), etaM: round(balance.etaM, 3), etaE: round(balance.etaE, 3),
    ge: round(Core.specificConsumption(balance.etaE, params.Hu), 0),
  },
});
