/*
 * Раздел 5 отчёта. Газообмен.
 *   intake — давление и температура конца впуска ВАЗ-21126 по оборотам (потери на впуске Δp_a = ζρw²/2);
 *   flow   — проверка принятой скорости заряда w = 6,6·c_m для I4 при 6500 об/мин: средняя скорость
 *            по уравнению неразрывности через щель двух впускных клапанов Ø27 мм (подъём из 3D-модели)
 *            и наибольшая мгновенная скорость на такте впуска;
 *   boost  — наддув дизеля V8: компрессор, расход воздуха, мощность компрессора, работа насосных ходов.
 */
'use strict';
const { Core, round, save, simulationSpecs, DEFAULT_RPM } = require('./lib');

const DEG = Core.DEG;

const intake = [1000, 2000, 3000, 4000, 5000, 5600, 6000].map((rpm) => {
  const state = Core.intakeState(Core.VAZ21126, {}, rpm);
  return {
    n: rpm, cm: round(state.cm, 2), w: round(state.wIn, 1), dpa: round(state.dpa / 1e3, 2),
    pa: round(state.pa / 1e3, 1), Ta: round(state.Ta, 1), gr: round(state.gammaR, 4),
  };
});

function chargeSpeedI4(rpm) {
  const spec = simulationSpecs().I4;
  const engine = Core.SIM_ENGINES.I4;
  const omega = Core.omegaOf(rpm);
  const valveDiameter = 0.027;
  let areaSum = 0, openSteps = 0, wmax = 0, wmaxAt = 0;
  for (let phase = 0; phase < 720; phase += 0.5) {
    const lift = spec.liftAtCyclePhase(spec.INTAKE, phase) / 1000;
    if (lift <= 1e-4) continue;
    areaSum += Math.min(Math.PI * valveDiameter * lift, Math.PI * valveDiameter * valveDiameter / 4);
    openSteps++;
    if (phase < 180 && lift > 1e-3) {
      const speed = Core.valveGasSpeed(engine, 2, valveDiameter, lift, Core.kinematics(engine, phase * DEG, omega).v);
      if (speed > wmax) { wmax = speed; wmaxAt = phase; }
    }
  }
  const openTime = openSteps * 0.5 * DEG / omega;
  const meanArea = areaSum / openSteps;
  return {
    rpm, wMeanCont: round(Core.geometry(engine).Vh / openTime / (2 * meanArea), 1), wKw: round(6.6 * Core.meanPistonSpeed(engine, rpm), 1),
    wmax: round(wmax, 0), phw: wmaxAt, cm: round(Core.meanPistonSpeed(engine, rpm), 2),
  };
}

function boostV8() {
  const engine = Core.SIM_ENGINES.V8, rpm = DEFAULT_RPM.V8;
  const params = Core.dieselSimParams(engine, {}, rpm);
  const sim = Core.simulateCycle(engine, params, { rpm, stepDeg: 0.5 });
  const compressorParams = Object.assign({}, Core.DEFAULT_PARAMS, Core.DIESEL_PARAMS);
  const airFlow = sim.mFresh * engine.cylinders * rpm / 120;
  const perKilogram = Core.compressor(compressorParams, 1);
  const total = Core.compressor(compressorParams, airFlow);
  return {
    rpm, pa: round(params.pa / 1e3, 1), Ta: round(params.Ta, 1), Tk: round(perKilogram.Tk, 1), pik: round(perKilogram.pik, 3),
    lk: round(perKilogram.lk / 1e3, 1), etaAd: round(perKilogram.etaAd, 3), air: round(airFlow, 4),
    Nk: round(total.power / 1e3, 1), NkPerTurbo: round(total.power / 2e3, 1), Lpump: round(sim.Lpump, 1),
  };
}

save('intake', { intake, flow: chargeSpeedI4(6500), boost: boostV8() });
