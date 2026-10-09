import RAPIER from '@dimforge/rapier3d-compat';
import { beforeAll, expect, it } from 'vitest';
import { HOOD_CALIBRATION, interpolateHood } from '../src/sim/hood';
import { defaultBot, robotConfig } from '../src/setup';
import { DT, NO_INPUT, Sim } from '../src/sim/world';
import { Executor } from '../src/auto/executor';

beforeAll(async () => { await RAPIER.init(); });
it('preserves reference launch positions when enabling a calibrated hood', () => {
  const fixed = new Sim(RAPIER, robotConfig(defaultBot(0)), 'practice', 7);
  const calibrated = new Sim(RAPIER, robotConfig({ ...defaultBot(0), autoHood: true }), 'practice', 7);
  for (const s of [fixed, calibrated]) for (let i = 0; i < 0.2 / DT; i++) s.step({ ...NO_INPUT, intake: 'none' });
  const reference = new Executor().launchSpot(fixed);
  expect(Math.abs(reference.z)).not.toBe(1.3); // A measured spot, rather than the planner's fallback.
  expect(new Executor().launchSpot(calibrated)).toEqual(reference);
  fixed.world.free(); calibrated.world.free();
});
it('interpolates measured pairs and does not extrapolate or accept malformed tables', () => {
  const points = [{ distanceM: 0.5, angleDeg: 75 }, { distanceM: 1, angleDeg: 65 }];
  expect(interpolateHood(points, 0.75)).toBe(70);
  expect(interpolateHood(points, 0.5)).toBe(75);
  expect(interpolateHood(points, 1)).toBe(65);
  expect(interpolateHood(points, 0.4)).toBeNull();
  expect(interpolateHood(points, 1.1)).toBeNull();
  expect(interpolateHood([...points].reverse(), 0.75)).toBeNull();
  expect(interpolateHood([points[0], points[0]], 0.5)).toBeNull();
  expect(interpolateHood([], 0.5)).toBeNull();
  expect(interpolateHood(points, NaN)).toBeNull();
});

it.each(['pollen', 'nectar'] as const)('uses the experimental %s table for servo motion, preview, and launch', kind => {
  const c = robotConfig({ ...defaultBot(0), autoHood: true, hoodAimMode: 'calibrated', hoodMinDeg: 55, hoodMaxDeg: 80 });
  const lp = c.shooter[kind]; lp.elevationDeg.std = 0; lp.yawStdDeg = 0; lp.speed.std = 0; lp.backspinRpm.std = 0;
  const s = new Sim(RAPIER, c, 'practice', 7);
  const m = s.hives.red.mouthCenter(), distanceM = 0.7;
  s.robot.setTranslation({ x: m.x, y: s.robot.translation().y, z: m.z + distanceM + lp.offset[0] }, true);
  s.robot.setRotation({ x: 0, y: -Math.sin(Math.PI / 4), z: 0, w: Math.cos(Math.PI / 4) }, true);
  s.carried = [kind === 'pollen' ? 'pollen' : 'nectar_red'];
  for (let i = 0; i < 1 / DT; i++) s.step({ ...NO_INPUT, intake: 'none' });
  const now = s.hives.red.mouthCenter(), p = s.robot.translation();
  const actualDistance = Math.hypot(now.x - p.x, now.z - p.z + lp.offset[0]);
  expect(s.hoodAngleDeg).toBeCloseTo(interpolateHood(HOOD_CALIBRATION[kind], actualDistance)!, 1);
  expect(s.hoodReady()).toBe(true); expect(s.previewShot(kind).scores).toBe(true); expect(s.autoHoodReady()).toBe(true);
  const ids = new Set(s.balls.keys()), angle = s.hoodAngleDeg;
  s.step({ ...NO_INPUT, shootPollen: kind === 'pollen', shootNectar: kind === 'nectar', intake: 'none' });
  const ball = [...s.balls.values()].find(b => !ids.has(b.id))!;
  expect(ball).toBeDefined(); const v = ball.body.linvel();
  expect(Math.atan2(v.y, Math.hypot(v.x, v.z)) * 180 / Math.PI).toBeCloseTo(angle, 0);
  let entered = false, prev = ball.body.translation();
  for (let i = 0; i < 1.8 / DT; i++) { s.step({ ...NO_INPUT, intake: 'none' }); const next = ball.body.translation(); entered ||= s.hives.red.entersMouth(prev, next, ball.radius); prev = next; }
  expect(entered).toBe(true); expect(s.hives.red.containsInUpCell(prev, ball.radius)).toBe(true);
  s.world.free();
});

it('blocks shots and hypothetical launch spots outside the measured distance interval', () => {
  const c = robotConfig({ ...defaultBot(0), autoHood: true, hoodAimMode: 'calibrated', hoodMinDeg: 55, hoodMaxDeg: 80 });
  const s = new Sim(RAPIER, c, 'practice', 7), m = s.hives.red.mouthCenter();
  const pose = { x: m.x, z: m.z + 0.3, heading: -Math.PI / 2 };
  s.robot.setTranslation({ ...pose, y: s.robot.translation().y }, true);
  s.robot.setRotation({ x: 0, y: -Math.sin(Math.PI / 4), z: 0, w: Math.cos(Math.PI / 4) }, true);
  for (let i = 0; i < 0.3 / DT; i++) s.step({ ...NO_INPUT, shootPollen: true, intake: 'none' });
  expect(s.carried.length).toBe(4); expect(s.autoHoodReady()).toBe(false);
  expect(s.previewShot('pollen', pose).scores).toBe(false);
  s.world.free();
});
