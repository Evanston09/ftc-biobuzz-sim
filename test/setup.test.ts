import { describe, expect, it } from 'vitest';
import { REF_ERR, defaultBot, robotConfig, sanitize, type BotSetup } from '../src/setup';

describe('sanitize', () => {
  it('maps a stored spreadX to the three launcher errors once, and then drops it', () => {
    const stored = { ...defaultBot(0), spreadX: 2 } as BotSetup & { spreadX?: number };
    const once = sanitize(stored, 0);
    expect([once.errElevDeg, once.errAzimDeg, once.errSpeed]).toEqual([REF_ERR.errElevDeg * 2, REF_ERR.errAzimDeg * 2, REF_ERR.errSpeed * 2]);
    expect('spreadX' in once).toBe(false);
    // The robot config popup writes the chip values into the setup and sanitizes it again (#8).
    const edited = sanitize({ ...once, errElevDeg: 3, errAzimDeg: 3.6, errSpeed: 0.24 }, 0);
    expect([edited.errElevDeg, edited.errAzimDeg, edited.errSpeed]).toEqual([3, 3.6, 0.24]);
  });
});

it('loads older hood settings at 67° and clamps invalid travel', () => {
  const old = { ...defaultBot(0) }; delete old.hoodAngleDeg;
  expect(robotConfig(sanitize(old, 0)).shooter.hoodAngleDeg).toBe(67);
  expect(sanitize({ ...old, hoodAngleDeg: -10 }, 0).hoodAngleDeg).toBe(20);
  expect(sanitize({ ...old, hoodAngleDeg: 100 }, 0).hoodAngleDeg).toBe(80);
  expect(sanitize({ ...old, hoodAngleDeg: NaN }, 0).hoodAngleDeg).toBe(67);
});

it('preserves automatic hood settings and normalizes limits for UI and headless configurations', () => {
  const b = sanitize({ ...defaultBot(0), autoHood: true, hoodMinDeg: 75, hoodMaxDeg: 55, hoodSlewDegPerSec: 30 }, 0);
  expect([b.hoodMinDeg, b.hoodMaxDeg]).toEqual([55, 75]);
  const c = robotConfig(b);
  expect(c.shooter.autoHood).toBe(true);
  expect([c.shooter.hoodMinDeg, c.shooter.hoodMaxDeg, c.shooter.hoodSlewDegPerSec]).toEqual([55, 75, 30]);
});
