// Shared controlled-shot fixture for calibration and held-out interpolation validation.
import RAPIER from '@dimforge/rapier3d-compat';
import { defaultBot, robotConfig } from '../src/setup';
import { HIVE } from '../src/sim/config';
import { DT, NO_INPUT, Sim } from '../src/sim/world';

export function runHoodShot(distanceM: number, kind: 'pollen' | 'nectar', angleDeg: number, seed: number) {
  const c = robotConfig(defaultBot(0)); c.shooter.autoHood = false; c.shooter.hoodAngleDeg = angleDeg;
  const s = new Sim(RAPIER, c, 'practice', seed);
  // Keep the standard CELL load, remove unrelated floor balls to make controlled trials inexpensive.
  for (const [id, b] of s.balls) if (b.body.translation().y < 1) { s.world.removeRigidBody(b.body); s.balls.delete(id); }
  s.robot.setRotation({ x: 0, y: -Math.sin(Math.PI / 4), z: 0, w: Math.cos(Math.PI / 4) }, true);
  const mouth = s.hives.red.mouthCenter();
  s.robot.setTranslation({ x: HIVE.pivotX.red, y: s.robot.translation().y, z: mouth.z + distanceM + c.shooter[kind].offset[0] }, true);
  // Settle the preloaded CELL before measuring the final release-to-mouth distance.
  for (let k = 0; k < 0.15 / DT; k++) s.step({ ...NO_INPUT, intake: 'none' });
  const m = s.hives.red.mouthCenter();
  s.robot.setTranslation({ x: m.x, y: s.robot.translation().y, z: m.z + distanceM + c.shooter[kind].offset[0] }, true);
  // Check the calibrated mean preview without letting a readiness gate censor experimental misses.
  s.cfg.shooter.autoHood = true; s.cfg.shooter.hoodAimMode = 'calibrated'; s.robots[0].hoodAngleDeg = angleDeg;
  const previewScores = s.previewShot(kind).scores; s.cfg.shooter.autoHood = false;
  s.carried = [kind === 'pollen' ? 'pollen' : 'nectar_red'];
  const before = new Set(s.balls.keys());
  s.step({ ...NO_INPUT, shootPollen: kind === 'pollen', shootNectar: kind === 'nectar', intake: 'none' });
  const ball = [...s.balls.values()].find(b => !before.has(b.id))!;
  let p = ball.body.translation(), entered = false;
  for (let k = 0; k < 1.8 / DT; k++) {
    s.step({ ...NO_INPUT, intake: 'none' });
    const q = ball.body.translation();
    entered ||= s.hives.red.entersMouth(p, q, ball.radius); p = q;
  }
  const retained = entered && (s.hives.red.tips > 0 || s.hives.red.containsInUpCell(p, ball.radius));
  s.world.free(); return { entered, retained, previewScores };
}
