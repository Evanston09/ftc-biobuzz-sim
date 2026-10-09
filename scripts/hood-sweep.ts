// Runs paired full-match sweeps with fixed rear-facing shooters and otherwise identical baseline robots.
// Run: node --import tsx scripts/hood-sweep.ts [seeds=8] [parallel=6] [tag=hood-screen] [ranges=55:65,60:70,...] [mode=ballistic]
// Each range enables automatic aiming; fixed:65 and fixed:67 are manual-angle controls.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { defaultBot } from '../src/setup';

const [n = '8', parallel = '6', tag = 'hood-screen', selections = 'fixed:65,fixed:67,55:65,60:65,60:70,65:70,55:75,60:75,65:75,55:80,60:80,65:80,70:80,20:80', mode = 'ballistic'] = process.argv.slice(2);
if (mode !== 'ballistic' && mode !== 'calibrated') throw new Error('Mode must be ballistic or calibrated');
if (!/^\w[\w-]*$/.test(tag) || !Number.isInteger(+n) || +n < 2 || !Number.isInteger(+parallel) || +parallel < 1) throw new Error('Use a simple tag, at least 2 seeds, and positive integer parallelism');
const ranges = selections.split(',').map(s => {
  const [a, b] = s.split(':');
  if (a === 'fixed' && b !== undefined && Number.isFinite(+b) && +b >= 20 && +b <= 80) return { id: `fixed-${b}`, angle: +b, min: +b, max: +b, auto: false };
  if (b === undefined || !Number.isFinite(+a) || !Number.isFinite(+b) || +a > +b || +a < 20 || +b > 80) throw new Error(`Invalid range ${s}`);
  return { id: `${a}-${b}`, angle: 67, min: +a, max: +b, auto: true };
});
for (const range of ranges) {
  const bots = [0, 1, 2, 3].map(i => ({ ...defaultBot(i), autoHood: range.auto, hoodAimMode: mode, hoodAngleDeg: range.angle, hoodMinDeg: range.min, hoodMaxDeg: range.max, hoodSlewDegPerSec: 120, turret: false, dualShooter: false, dualIntake: false }));
  console.log(`\n${tag}: ${range.id}, ${n} paired seeds`);
  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, ['--import', 'tsx', 'scripts/eval.ts', `${tag}-${range.id}`, n, parallel], {
      stdio: 'inherit', env: { ...process.env, BOTS: JSON.stringify(bots), OPPONENT: '', REFEREE: '', RANDOM_CELL: '', AUTO_INTAKE: '', OLD_TIP: '' },
    });
    child.on('error', reject); child.on('close', code => code === 0 ? resolve() : reject(new Error(`eval failed: ${code}`)));
  });
}
const all = fs.readFileSync('experiments/policy-loop.jsonl', 'utf8').trim().split('\n').map(s => JSON.parse(s));
const rows = ranges.map(r => ({ range: r, result: all.findLast(q => q.label === `${tag}-${r.id}`) }));
for (const row of rows) if (row.result?.n !== +n) throw new Error(`Incomplete run ${row.range.id}`);
rows.sort((a, b) => b.result.combined - a.result.combined);
const output = { at: new Date().toISOString(), tag, mode, seeds: +n, seedFormula: '1001 + 37*k', score: 'combined red + blue full-match points', setup: { ...defaultBot(0), hoodAimMode: mode, facing: 'rear', turret: false, dualShooter: false, hoodSlewDegPerSec: 120 }, rows };
fs.writeFileSync(`experiments/${tag}.json`, JSON.stringify(output, null, 2) + '\n');
console.log('\nRange | combined points | SE | AUTO points | tips');
for (const row of rows) console.log(`${row.range.id} | ${row.result.combined} | ${row.result.se} | ${row.result.auto} | ${row.result.tips}`);
