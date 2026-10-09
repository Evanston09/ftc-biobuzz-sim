/** Distance-based hood aiming. Limits and speed are design assumptions, not FTC rules. */
export const HOOD = { minDeg: 20, maxDeg: 80, defaultMinDeg: 55, defaultMaxDeg: 66, slewDegPerSec: 120, solvePeriodSec: 0.05, toleranceDeg: 0.25 };

export function hoodLimits(min = HOOD.defaultMinDeg, max = HOOD.defaultMaxDeg): [number, number] {
  const clamp = (n: number, fallback: number) => Number.isFinite(n) ? Math.max(HOOD.minDeg, Math.min(HOOD.maxDeg, n)) : fallback;
  const a = clamp(min, HOOD.defaultMinDeg), b = clamp(max, HOOD.defaultMaxDeg);
  return [Math.min(a, b), Math.max(a, b)];
}

/** Height at the target distance using the same 120 Hz gravity/drag integration as the shot preview. */
export function heightAtDistance(angleDeg: number, distance: number, height: number, speed: number, drag: number): number {
  const angle = angleDeg * Math.PI / 180, dt = 1 / 120;
  let x = 0, y = height, vx = speed * Math.cos(angle), vy = speed * Math.sin(angle);
  for (let i = 0; i < 240; i++) {
    const oldX = x, oldY = y, v = Math.hypot(vx, vy);
    vx -= drag * v * vx * dt; vy -= (drag * v * vy + 9.81) * dt;
    x += vx * dt; y += vy * dt;
    if (x >= distance) return oldY + (y - oldY) * (distance - oldX) / (x - oldX);
  }
  return -Infinity;
}

/** Finds a centered trajectory inside the travel limits. If unreachable, returns the closest bounded angle.
 * When two arcs exist, prefer the one nearest the configured starting angle to avoid switching branches.
 * The caller must still check the full mouth intersection: centering alone does not authorize firing.
 */
export function solveHood(distance: number, targetHeight: number, releaseHeight: number, speed: number, drag: number, min: number, max: number, preferred: number): number {
  const error = (angle: number) => heightAtDistance(angle, distance, releaseHeight, speed, drag) - targetHeight;
  let best = min, bestError = Infinity, previous = min, prevError = error(min);
  const roots: number[] = [];
  const samples = Math.max(1, Math.ceil((max - min) / 2));
  for (let i = 0; i <= samples; i++) {
    const angle = min + (max - min) * i / samples, e = error(angle);
    if (Math.abs(e) < bestError) { best = angle; bestError = Math.abs(e); }
    if (e === 0) roots.push(angle);
    if (Number.isFinite(e) && Number.isFinite(prevError) && e * prevError < 0) {
      let lo = previous, hi = angle, loError = prevError;
      for (let j = 0; j < 10; j++) {
        const mid = (lo + hi) / 2, midError = error(mid);
        if (midError * loError > 0) { lo = mid; loError = midError; } else hi = mid;
      }
      roots.push((lo + hi) / 2);
    }
    previous = angle; prevError = e;
  }
  return roots.length ? roots.reduce((a, b) => Math.abs(a - preferred) <= Math.abs(b - preferred) ? a : b) : best;
}
