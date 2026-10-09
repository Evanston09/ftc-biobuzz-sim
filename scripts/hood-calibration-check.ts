// Held-out shots at distances BETWEEN calibration knots, with seeds not used to fit the tables.
// Run: node --import tsx scripts/hood-calibration-check.ts [trials=32]
import RAPIER from '@dimforge/rapier3d-compat';
import fs from 'node:fs';
import { HOOD_CALIBRATION, interpolateHood } from '../src/sim/hood';
import { runHoodShot } from './hood-shot';
await RAPIER.init();
const trials = Number(process.argv[2] ?? 32);
if (!Number.isInteger(trials) || trials < 1) throw new Error('Positive integer trials required');
const rows = [];
for (const kind of ['pollen', 'nectar'] as const) {
  const table = HOOD_CALIBRATION[kind];
  for (let j = 1; j < table.length; j++) {
    const distanceM = +(0.5 * (table[j - 1].distanceM + table[j].distanceM)).toFixed(3), angleDeg = interpolateHood(table, distanceM)!;
    let entered = 0, retained = 0, previewScores = 0;
    for (let i = 0; i < trials; i++) {
      const r = runHoodShot(distanceM, kind, angleDeg, 50001 + 37 * i);
      entered += +r.entered; retained += +r.retained; previewScores += +r.previewScores;
    }
    rows.push({ kind, distanceM, angleDeg, trials, entered, retained, previewScores });
    console.log(`${kind} ${distanceM} m → ${angleDeg}°: ${retained}/${trials} retained, ${previewScores}/${trials} mean previews score`);
  }
}
const summary = { trials: rows.reduce((n, r) => n + r.trials, 0), retained: rows.reduce((n, r) => n + r.retained, 0), entered: rows.reduce((n, r) => n + r.entered, 0), rows };
fs.writeFileSync('experiments/hood-calibration-check.json', JSON.stringify(summary, null, 2) + '\n');
console.log(`Total: ${summary.retained}/${summary.trials} retained (${(100 * summary.retained / summary.trials).toFixed(1)}%)`);
if (rows.some(r => r.retained / r.trials < 0.95)) throw new Error('Interpolation reliability below 95% at a held-out distance');
