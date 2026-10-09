# Is 66° a tipping point? — October 8, 2026

Review scope: determine whether the earlier 65→66° gain is a special mathematical threshold or the
largest local benefit. Two independent review agents examined geometry/physics and paired statistics.
The main agent ran additional full-match sweeps. No shooter, physics, or planner defaults changed.

## Mathematical review

There is no special 66° branch or constant in flight physics. Initial velocity varies continuously
through sine/cosine; drag, gravity, and spin lift also vary continuously with state. The mouth-entry
test is a geometric inequality: a ball-radius-adjusted trajectory must cross inside the opening.
Crossing its floor/roof can change the discrete hit outcome, but its angle depends on release distance,
speed, height, spin, release offset, and CELL position.

Deterministic diagnostic trajectories use the calibrated preview's time step, drag, Magnus lift,
and damping with mean launch parameters, into the initially raised CELL settled for 0.15 seconds.
These lower entry boundaries exclude collisions and retention:

| Release-to-mouth distance | POLLEN lower entry boundary | NECTAR lower entry boundary |
|---|---:|---:|
| 0.65 m | 67.069° | 67.482° |
| 0.70 m | 65.774° | 66.246° |
| 0.75 m | 64.588° | 65.122° |
| 0.90 m | 61.702° | 62.458° |

At 0.70 m, the POLLEN mean preview changes from miss at 65.75° to hit at 66° because the boundary
is about 65.774°, not because the equation switches at 66°. At the nominal straight AUTO tree pose
(robot z = 1.32 m), the deterministic POLLEN entry interval is about 62.468–75.372°. At 65° its
actual dual-release aperture margin is already about 98 mm; at 66° it is about 103 mm. Nominal AUTO
positions therefore do not establish an abrupt mouth-entry threshold at 66°. Actual poses, random
flight error, retention contacts, CELL movement, and loading can still change the outcomes.

Review data are in `hood-aperture-boundary-review-20261008.json` and
`hood-nominal-aperture-review-20261008.json`; their protocols explicitly exclude contact and retention.

## Why scores can jump

The first AUTO shooter step requests three POLLEN. The initial three NECTAR give 4.95 POLLEN
equivalents: two more POLLEN reach 6.95, below the 7.4 reference tipping threshold, while three reach
7.95. One missed or bounced ball can remove a 20-point TIP. The partner waits for that TIP to raise
its target CELL, and subsequent work depends on the spill and deadlines. Smooth trajectory changes
can therefore cause discrete score and schedule changes.

The earlier review found mixed cargo can use POLLEN's hood setting for NECTAR, and the preview omits
the dual shooter's lateral release offset. Those flaws remain; these experiments measure the existing
implementation. Removing the mean-preview gate in an eight-seed AUTO counterfactual did not change
either cap's AUTO scores, so that gate is not an established explanation for the observed AUTO loss.

## Experiment design

Eight-seed screen: maximum angles 64, 64.5, 65, 65.25, 65.5, 65.75, 66, 66.25, 66.5, 66.75, 67,
67.5, and 68°. All have the same 50° minimum, calibrated tables, four identical baseline rear-facing
dual shooters, front-only intakes, 120°/s hood, and inherited fixed-67° launch positions. Only the
maximum angle changes. Below 66.5°, all table requests exceed the cap, so the mean angle is simply
clamped to that cap. This is not an experiment in optimizing shooter distance separately at every angle.

New 24-seed runs validate caps 64, 65, 65.5, and 65.75°. Existing identical 24-seed runs supply 66
and 67°. All use seeds `1001 + 37*k`; old 66/67 runs exactly reproduce their first eight scores in
the new screen. A match seed is the paired statistical unit, not each alliance independently.
The additional 16 seeds are also checked separately to reduce selection bias after choosing the
interesting quarter-degree interval from the first eight seeds.

## Results and statistical review

The 13-configuration screen ran 104 matches; the four new 24-seed controls ran 96, for **200 new
matches**. Earlier identical 24-seed controls at 66° and 67° complete the comparison.

| Maximum | 8-seed mean alliance points | 24-seed mean alliance points |
|---|---:|---:|
| 64° | 319.1 | 321.3 |
| 64.5° | 344.6 | — |
| 65° | 366.4 | 364.3 |
| 65.25° | 372.3 | — |
| 65.5° | 380.5 | 385.3 |
| 65.75° | 410.5 | 399.8 |
| 66° | 405.9 | 402.5 |
| 66.25° | 393.0 | — |
| 66.5° | 403.2 | — |
| 66.75° | 398.8 | — |
| 67° | 405.5 | 402.4 |
| 67.5° | 411.1 | — |
| 68° | 402.8 | — |

Means are calculated from raw per-seed scores divided by two, avoiding double rounding published
combined summaries. Gains below are paired per-alliance points; uncertainty is standard error.

| Maximum change | 24-seed gain ± paired SE | Gain on additional 16 seeds ± SE |
|---|---:|---:|
| 64→65° | +43.02 ± 4.44 | +40.91 ± 5.72 |
| 65→65.5° | +21.02 ± 5.43 | +24.47 ± 7.79 |
| 65.5→65.75° | +14.50 ± 6.27 | +6.75 ± 7.24 |
| 65.75→66° | +2.73 ± 4.39 | +6.38 ± 5.49 |
| 66→67° | −0.17 ± 5.41 | −0.03 ± 5.71 |

65→66° as a whole gains 38.25 ± 5.68 per alliance over 24 seeds (approximate 95% paired t interval
+26.5 to +50.0). The integer-step gain is not uniquely biggest: 64→65° has a larger point estimate,
but the difference of the two gains is only 4.77 ± 8.72 points and does not establish a ranking.

The screen's largest quarter-degree gain was 65.5→65.75° (+30.0 per alliance). Pooled validation
reduces that to +14.5, and the additional 16 seeds alone reduce it further to +6.75 ± 7.24. It is
therefore not an independently established abrupt breakthrough. Its pooled slope is 58 points per
degree, versus 42 for 65→65.5°; their difference is 15.96 ± 33.39 SE, too uncertain to establish a
uniquely steepest interval. The largest observed screen mean, at 67.5°, also does not prove an optimum.

**Conclusion:** this setup has a substantial rising region below about 66°, with the mean benefit
largely leveling off around 65.75–66°. Most of the observed 65→66 gain is already present by 65.75°.
66° is a reasonable target for travel margin, not an exact mathematical regime change or a proven
uniquely largest boost. The current model's unresolved preview/mixed-cargo flaws, inherited launch
positions, and lack of physical hood calibration prevent treating that boundary as a real-robot limit.

## Reproduce

```sh
node --import tsx scripts/hood-sweep.ts 8 6 hood-calibrated-threshold-screen-20261008 '50:64,50:64.5,50:65,50:65.25,50:65.5,50:65.75,50:66,50:66.25,50:66.5,50:66.75,50:67,50:67.5,50:68' calibrated
node --import tsx scripts/hood-sweep.ts 24 6 hood-calibrated-threshold-validation-20261008 '50:64,50:65' calibrated
node --import tsx scripts/hood-sweep.ts 24 3 hood-calibrated-threshold-fine-validation-20261008 '50:65.5,50:65.75' calibrated
```

Raw paired results are in the corresponding `experiments/<tag>.json` files and `policy-loop.jsonl`.
