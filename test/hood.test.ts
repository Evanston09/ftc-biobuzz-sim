import RAPIER from '@dimforge/rapier3d-compat';
import { beforeAll, expect, it } from 'vitest';
import { heightAtDistance, hoodLimits, solveHood } from '../src/sim/hood';
import { DEFAULT_ROBOT, HIVE } from '../src/sim/config';
import { DT, NO_INPUT, Sim } from '../src/sim/world';
import { Shooter } from '../src/auto/shooter';
import { AUTO_REGISTRY, AutoProgram } from '../src/auto/onboard';
import { loadTree } from '../src/bt';

beforeAll(async () => { await RAPIER.init(); });
const config = (min = 55, max = 75, speed = 120) => {
  const c = structuredClone(DEFAULT_ROBOT);
  Object.assign(c.shooter, { autoHood: true, hoodMinDeg: min, hoodMaxDeg: max, hoodAngleDeg: min, hoodSlewDegPerSec: speed, facing: 'rear', turret: false });
  return c;
};
const face = (s: Sim, z: number) => {
  s.robot.setTranslation({ x: HIVE.pivotX.red, y: s.robot.translation().y, z }, true);
  s.robot.setRotation({ x: 0, y: -Math.sin(Math.PI / 4), z: 0, w: Math.cos(Math.PI / 4) }, true);
};
const settle = (s: Sim, seconds = 1) => { for (let k = 0; k < seconds / DT; k++) s.step({ ...NO_INPUT, intake: 'none' }); };

it('normalizes reversed ranges and finds a drag-aware centered arc', () => {
  expect(hoodLimits(85, 10)).toEqual([20, 80]);
  const angle = solveHood(0.6, 1.3, 0.38, 5.35, 0.03, 50, 80, 65);
  expect(heightAtDistance(angle, 0.6, 0.38, 5.35, 0.03)).toBeCloseTo(1.3, 3);
});

it('changes angle with distance, stays in range, and previews hypothetical poses independently of the servo', () => {
  const s = new Sim(RAPIER, config(), 'practice', 7);
  face(s, 1.1); settle(s);
  const close = s.hoodAngleDeg;
  expect(s.hoodReady()).toBe(true);
  expect(s.previewShot('pollen').scores).toBe(true);
  face(s, 1.4); settle(s);
  expect(s.hoodAngleDeg).not.toBeCloseTo(close, 1);
  expect(s.hoodAngleDeg).toBeGreaterThanOrEqual(55);
  expect(s.hoodAngleDeg).toBeLessThanOrEqual(75);
  expect(s.previewShot('pollen').scores).toBe(true);
  s.robots[0].hoodAngleDeg = 55;
  expect(s.previewShot('pollen', { x: HIVE.pivotX.red, z: 1.4, heading: -Math.PI / 2 }).scores).toBe(true);
  s.world.free();
});

it('waits for movement to finish before firing, including through the AUTO behavior-tree leaf', () => {
  const s = new Sim(RAPIER, config(55, 75, 10), 'auto', 7); s.start(); face(s, 1.3);
  const tree = loadTree({ kind: 'bt.tree', id: 'hood-shoot', name: 'Hood test', env: 'onboard', root: { ref: 'shooter.shoot', params: { count: 1, timeoutSec: 3 } } }, AUTO_REGISTRY);
  const program = new AutoProgram(tree);
  const n = s.carried.length, start = s.hoodAngleDeg;
  for (let k = 0; k < 0.1 / DT; k++) {
    const input = program.update(s, DT);
    expect(input.shootPollen).toBe(false);
    s.step(input, true);
  }
  expect(s.carried.length).toBe(n);
  expect(s.hoodAngleDeg - start).toBeCloseTo(1, 2);
  expect(new Shooter().canShoot(s, 'pollen', false)).toBe(false);
  let fired = false;
  for (let k = 0; k < 2.5 / DT; k++) {
    const input = program.update(s, DT);
    if (input.shootPollen) { expect(s.autoHoodReady()).toBe(true); fired = true; }
    s.step(input, true);
    if (s.carried.length < n) break;
  }
  expect(fired).toBe(true); expect(s.carried.length).toBe(n - 1);
  s.world.free();
});

it('does not shoot an unreachable target even after the bounded hood settles', () => {
  const s = new Sim(RAPIER, config(20, 30), 'practice', 7); face(s, 1.3);
  for (let k = 0; k < 1 / DT; k++) s.step({ ...NO_INPUT, shootPollen: true, intake: 'none' });
  expect(s.hoodReady()).toBe(true); expect(s.autoHoodReady()).toBe(false);
  expect(s.carried.length).toBe(4);
  expect(s.hoodAngleDeg).toBeGreaterThanOrEqual(20); expect(s.hoodAngleDeg).toBeLessThanOrEqual(30);
  s.world.free();
});

it('uses NECTAR ballistics and keeps each robot hood state independent', () => {
  const s = new Sim(RAPIER, config(), 'practice', 7, { partners: true }); face(s, 1.3);
  s.carried = ['nectar_red']; settle(s);
  expect(s.robots[0].hoodKind).toBe('nectar'); expect(s.previewShot('nectar').scores).toBe(true);
  expect(s.robots[0].hoodAngleDeg).not.toBe(s.robots[1].hoodAngleDeg);
  s.world.free();
});

it('launches at the actual settled automatic hood angle', () => {
  const c = config(); c.shooter.type = 'fifo';
  c.shooter.pollen.elevationDeg.std = 0; c.shooter.pollen.yawStdDeg = 0; c.shooter.pollen.speed.std = 0;
  const s = new Sim(RAPIER, c, 'practice', 7); face(s, 1.3); settle(s);
  const angle = s.hoodAngleDeg, before = new Set(s.balls.keys());
  s.step({ ...NO_INPUT, shootPollen: true, intake: 'none' });
  const ball = [...s.balls.values()].find(b => !before.has(b.id))!;
  expect(ball).toBeDefined();
  const v = ball.body.linvel();
  expect(Math.atan2(v.y, Math.hypot(v.x, v.z)) * 180 / Math.PI).toBeCloseTo(angle, 0);
  s.world.free();
});
