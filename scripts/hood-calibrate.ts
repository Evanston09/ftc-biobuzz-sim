// Builds experimental distance→angle tables from retained simulated shots, not a trajectory equation.
// Run: node --import tsx scripts/hood-calibrate.ts [parallel=4]
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const parallel = Number(process.argv[2] ?? 4);
if (!Number.isInteger(parallel) || parallel < 1) throw new Error('Positive integer parallelism required');
const jobs = (['pollen', 'nectar'] as const).flatMap(kind => Array.from({ length: 10 }, (_, i) => ({ kind, distanceM: +(0.25 + i * 0.1).toFixed(2) })));
interface Sample { angleDeg: number; trials: number; entered: number; retained: number }
interface CalibrationRow { kind: 'pollen' | 'nectar'; distanceM: number; best: Sample; coarse: Sample[]; fine: Sample[] }
const rows: CalibrationRow[] = []; let next = 0;
await Promise.all(Array.from({ length: Math.min(parallel, jobs.length) }, async () => {
  while (next < jobs.length) {
    const job = jobs[next++];
    const row = await new Promise<CalibrationRow>((resolve, reject) => {
      const child = spawn(process.execPath, ['--import', 'tsx', 'scripts/hood-calibrate-worker.ts', String(job.distanceM), job.kind], { stdio: ['ignore', 'pipe', 'inherit'] });
      let out = ''; child.stdout.on('data', d => { out += d; }); child.on('error', reject);
      child.on('close', code => { if (code !== 0) reject(new Error(`Calibration failed ${job.kind} ${job.distanceM}`)); else { try { resolve(JSON.parse(out.trim().split('\n').pop()!)); } catch (e) { reject(e); } } });
    });
    rows.push(row); console.log(`${rows.length}/${jobs.length} ${row.kind} ${row.distanceM} m → ${row.best.angleDeg}°, retained ${row.best.retained}/${row.best.trials}`);
  }
}));
rows.sort((a, b) => a.kind.localeCompare(b.kind) || a.distanceM - b.distanceM);
// Only retain a contiguous interval of useful calibration points. Never interpolate across an unreachable hole.
const table = (kind: CalibrationRow['kind']) => {
  const r = rows.filter(r => r.kind === kind); let best: CalibrationRow[] = [], run: CalibrationRow[] = [];
  for (const row of r) { if (row.best.retained / row.best.trials >= 0.95) run.push(row); else run = []; if (run.length > best.length) best = [...run]; }
  if (best.length < 2) throw new Error(`No usable ${kind} calibration interval`);
  return best.map(r => ({ distanceM: r.distanceM, angleDeg: r.best.angleDeg }));
};
const output = { pollen: table('pollen'), nectar: table('nectar') };
fs.writeFileSync('src/sim/hood-calibration.json', JSON.stringify(output, null, 2) + '\n');
fs.writeFileSync('experiments/hood-calibration.json', JSON.stringify({ at: new Date().toISOString(), minimumFitRetention: 0.95, protocol: 'Fixed rear shooter, defaultBot build, standard CELL load, stationary straight-in shots; retained after 1.8 s. Coarse 50–80° at 1° with 4 shots, refine ±2° at 0.5° with 16 shots. Same seeds per angle; validation uses different seeds and intervening distances.', rows, table: output }, null, 2) + '\n');
console.log('Saved src/sim/hood-calibration.json and experiments/hood-calibration.json');
