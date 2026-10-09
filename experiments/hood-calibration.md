# Experimentally calibrated hood — October 8, 2026

The automatic hood can use successful simulated distance/angle pairs with piecewise linear interpolation,
matching the approach of experimentally tuning a robot. This is an optional mechanism; the default remains
fixed at 67°. Angles below are ball exit elevation above horizontal, not the CAD hood's revolve angle.

## Fitting protocol

All trials used the same `defaultBot(0)` physical build: rear-facing dual shooter, front intake, no turret,
reference launch speed, release height, backspin, and random shot errors. Distance is horizontal from the
centered ball release point to the raised CELL mouth, in meters. The robot is stationary and shoots straight
into the opening; the CELL has its standard initial load of three NECTAR. Remove unrelated floor balls,
settle the CELL for 0.15 s, launch one ball, and simulate 1.8 s. A success must enter the mouth and either
remain inside the raised CELL or produce a TIP. The firing gate is disabled for these trials so it cannot
hide experimental misses.

For each ball type at 0.25–1.15 m in 0.10 m steps, screen 50–80° in 1° steps with four shots per angle.
Refine within ±2° of the best screened angle at 0.5° steps, with 16 shots per angle. Rank by retention,
then mouth entry, then proximity to 67°. Seeds are paired across angles: `20001 + 37*i` for screening,
`30001 + 37*i` for refinement. This is a coarse search, not proof of a unique optimal angle.

Retain the longest contiguous run of points with at least 95% observed retention in fitting trials
(16/16 at this sample size). Do not interpolate across an unsuccessful point or extrapolate beyond the
included interval. The wider initial 75% threshold was rejected after match testing.

## Bundled table

| Release-to-mouth distance | POLLEN angle | NECTAR angle |
|---|---:|---:|
| 0.65 m | 69.5° | 70.5° |
| 0.75 m | 67° | 68.5° |
| 0.85 m | 67° | 66.5° |
| 0.95 m | 67° | 67° |
| 1.05 m | 67° | 67° |
| 1.15 m | 67° | outside calibrated interval |

For example, at 0.70 m the interpolated POLLEN angle is 68.25°, and NECTAR is 69.5°.
Much of the POLLEN interval stays at 67° because several tested angles succeeded equally and the
tie-break prefers the existing reference angle. A distance map need not have a constant slope or be monotonic.

The hood target updates at 20 Hz and moves at the configured finite speed, default 120°/s. Automatic
fire control waits for the actual angle to settle, a stationary chassis, a CELL near its raised stop,
and a mean scoring preview. Calibrated previews include airborne drag, backspin lift, and damping;
the table itself is fitted with actual Rapier flights and collisions. TELEOP preserves the fixed-angle
reference launch positions rather than recomputing its standoff from the new preview. Actual fire
control and the visible trajectory still use the calibrated hood angle.

## Held-out interpolation test

Test every midpoint between included knots with 32 shots using new seeds `50001 + 37*i`.
This exercises interpolation rather than replaying fitted distances.

- POLLEN: 160/160 retained at 0.70, 0.80, 0.90, 1.00, and 1.10 m.
- NECTAR: 125/128 retained at 0.70, 0.80, 0.90, and 1.00 m.
- Total: **285/288 retained (99.0%)**, 286/288 entered the mouth.
- Every midpoint retained at least 31/32 (96.9%). All mean previews predicted entry.

These figures describe this controlled stationary setup, not a 99% match scoring guarantee. CELL load,
angled approaches, collisions, and random shot errors differ during matches. The table is specific to
the reference launch speed, height, backspin, and ball physics; recalibrate after changing them. It is
not a physical robot calibration or a conversion of the CAD's 25° revolve dimension.

## Full-match comparison

24 paired seeds `1001 + 37*i`, four otherwise identical baseline robots, both alliances using the same
mode. Combined points sum both alliances; dividing by two gives average alliance points.

| Mode | Combined mean ± SE | Mean alliance points | Combined AUTO |
|---|---:|---:|---:|
| Fixed 67° reference | 819.1 ± 7.0 | 409.6 | 172.2 |
| Earlier gravity/drag automatic, 55–66° | 767.7 ± 6.5 | 383.9 | 127.8 |
| Wide initial table, recalculated launch spots — rejected | 705.3 ± 9.2 | 352.7 | 171.4 |
| Final table, recalculated launch spots — rejected | 713.3 ± 8.9 | 356.7 | 171.4 |
| **Final table, reference launch spots — kept as optional mode** | **806.7 ± 7.6** | **403.4** | **171.4** |

The kept implementation loses 12.4 combined points relative to fixed, paired SE 6.4 (n=24). It improves
93.4 points over recalculating launch spots, paired SE 8.7. AUTO is close to the fixed reference.
This does not establish a points improvement over fixed; it demonstrates working experimental
interpolation without the large route-related loss. A four-seed fixed-spot screen scored 833.0 before
the 24-seed validation. All kept and rejected match rows are in `policy-loop.jsonl`.

## Reproduce and see it

Run `npm run dev`, open `/sim/`, and select a robot's settings:
**Hood control → Automatic by distance**, **Hood aiming → Calibrated table (linear)**,
minimum 55°, maximum 80°. The live hood angle and aiming arc change with distance. Existing saved
settings can retain the older trajectory-equation mode; choose the table explicitly.

```sh
node --import tsx scripts/hood-calibrate.ts 4
node --import tsx scripts/hood-calibration-check.ts 32
BOTS='[{"autoHood":true,"hoodAimMode":"calibrated","hoodMinDeg":55,"hoodMaxDeg":80},{"autoHood":true,"hoodAimMode":"calibrated","hoodMinDeg":55,"hoodMaxDeg":80},{"autoHood":true,"hoodAimMode":"calibrated","hoodMinDeg":55,"hoodMaxDeg":80},{"autoHood":true,"hoodAimMode":"calibrated","hoodMinDeg":55,"hoodMaxDeg":80}]' node --import tsx scripts/eval.ts my-calibrated-hood 24 6
python3 scripts/eval-compare.py hood-fixed-reference-20261008 my-calibrated-hood
```

Fitting writes `src/sim/hood-calibration.json` and the raw `experiments/hood-calibration.json`.
Validation writes `experiments/hood-calibration-check.json`; the rejected wider interval's held-out
test is preserved in `hood-calibration-check-wide.json`. Custom paired tables can also be supplied
as `RobotConfig.shooter.hoodCalibration`.
