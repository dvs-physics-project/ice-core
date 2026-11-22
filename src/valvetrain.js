/*
 * Газораспределение и приводы.
 *
 *   valveMotion(H, halfWidthRad, peakDeg, phaseDeg, omega) — закон подъёма клапана симуляции
 *       h = H·(1 − u²)², u = (Φ − Φ_max) / (2β): β — половина угла действия кулачка по углу распредвала,
 *       Φ — угол цикла. Скорость и ускорение клапана — производные по времени при ω_р = ω/2.
 *   valveTiming(H, halfWidthRad, peakDeg, threshold) — фазы: углы открытия и закрытия по порогу подъёма
 *   valveGasSpeed(engine, valves, diameter, lift, pistonSpeed) — средняя скорость газа в клапане
 *       по уравнению неразрывности (через меньшее из сечений: щель клапана или горловина)
 *   drives — передачи: делительный диаметр шкива, длина ремня N·p, передаточное отношение, скорость ремня,
 *       шестерни модуля m, межосевое расстояние, скорость наружного ротора героторного насоса
 */
'use strict';
const { geometry } = require('./geometry');
const { DEG, mod } = require('./util');

function valveMotion(H, halfWidthRad, peakDeg, phaseDeg, omega = 0) {
  const fromPeakDeg = mod(phaseDeg - peakDeg + 360, 720) - 360;
  const u = (fromPeakDeg * DEG) / (2 * halfWidthRad);
  if (Math.abs(u) >= 1) return { h: 0, v: 0, a: 0, u };
  const w = 1 - u * u;
  const dudt = omega / (2 * halfWidthRad);
  return { h: H * w * w, v: -4 * H * u * w * dudt, a: H * (12 * u * u - 4) * dudt * dudt, u };
}

function valveTiming(H, halfWidthRad, peakDeg, threshold = 0) {
  const u = threshold > 0 ? Math.sqrt(1 - Math.sqrt(threshold / H)) : 1;
  const halfDurationDeg = (u * 2 * halfWidthRad) / DEG;
  return { open: mod(peakDeg - halfDurationDeg, 720), close: mod(peakDeg + halfDurationDeg, 720), durationDeg: 2 * halfDurationDeg };
}

function valveGasSpeed(engine, valves, diameter, lift, pistonSpeed) {
  const geom = geometry(engine);
  const curtainArea = valves * Math.PI * diameter * lift;
  const throatArea = valves * Math.PI * diameter * diameter / 4;
  const area = Math.min(curtainArea, throatArea);
  return area > 0 ? Math.abs(pistonSpeed) * geom.F / area : Infinity;
}

const drives = {
  pitchDiameter: (teeth, pitch) => (teeth * pitch) / Math.PI,
  beltLength: (teeth, pitch) => teeth * pitch,
  ratio: (driverTeeth, drivenTeeth) => driverTeeth / drivenTeeth,
  beltSpeed: (teeth, pitch, rpm) => ((teeth * pitch) / Math.PI) * Math.PI * rpm / 60,
  gearPitchDiameter: (module, teeth) => module * teeth,
  centerDistance: (module, teeth1, teeth2) => (module * (teeth1 + teeth2)) / 2,
  gerotorOuterSpeed: (innerTeeth, outerTeeth, rpm) => (rpm * innerTeeth) / outerTeeth,
};

module.exports = { valveMotion, valveTiming, valveGasSpeed, drives };
