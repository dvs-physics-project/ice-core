/*
 * Закон сгорания Вибе (формула 3.14): x = 1 − exp(−a·t^(m+1)), t = (Φ − Φ_нач) / Φ_z.
 *
 *   wiebe(phaseDeg, params) → { x — доля сгоревшего топлива, dxda — её производная по углу, 1/рад }
 */
'use strict';
const { DEG } = require('../util');

function wiebe(phaseDeg, params) {
  const t = (phaseDeg - params.sparkDeg) / params.burnDeg;
  if (t <= 0) return { x: 0, dxda: 0 };
  if (t >= 1) return { x: 1 - Math.exp(-params.wiebeA), dxda: 0 };
  const unburned = Math.exp(-params.wiebeA * t ** (params.wiebeM + 1));
  return {
    x: 1 - unburned,
    dxda: ((params.wiebeA * (params.wiebeM + 1)) / (params.burnDeg * DEG)) * t ** params.wiebeM * unburned,
  };
}

module.exports = { wiebe };
