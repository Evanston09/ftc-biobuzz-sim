// One distance/ball-kind calibration job, using launched balls in Rapier (including lift and collisions).
import RAPIER from '@dimforge/rapier3d-compat';
import { runHoodShot } from './hood-shot';

await RAPIER.init();
const distanceM = Number(process.argv[2]), kind = process.argv[3] as 'pollen' | 'nectar';
if (!(distanceM > 0) || !['pollen', 'nectar'].includes(kind)) throw new Error('distance and pollen|nectar required');
function measure(angleDeg: number, trials: number, firstSeed: number) {
  let entered = 0, retained = 0;
  for (let i = 0; i < trials; i++) { const r = runHoodShot(distanceM, kind, angleDeg, firstSeed + 37 * i); entered += +r.entered; retained += +r.retained; }
  return { angleDeg, trials, entered, retained };
}
const coarse = Array.from({ length: 31 }, (_, i) => measure(50 + i, 4, 20001));
// Prefer successful angles near 67° when a four-shot screening rate ties.
const ranked = [...coarse].sort((a, b) => b.retained - a.retained || b.entered - a.entered || Math.abs(a.angleDeg - 67) - Math.abs(b.angleDeg - 67));
const center = ranked[0].angleDeg;
const fine = Array.from({ length: 9 }, (_, i) => center - 2 + 0.5 * i).filter(a => a >= 50 && a <= 80).map(a => measure(a, 16, 30001));
const best = [...fine].sort((a, b) => b.retained - a.retained || b.entered - a.entered || Math.abs(a.angleDeg - 67) - Math.abs(b.angleDeg - 67))[0];
console.log(JSON.stringify({ distanceM, kind, best, coarse, fine }));
