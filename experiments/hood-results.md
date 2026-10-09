# Automatic hood range experiments — October 8, 2026

The highest measured automatic-hood mean among the 24-seed finalists was **55–66°**. It is the default range when automatic hood control is enabled. **20–65° and 55–65° are statistically tied with it**; these runs do not identify a uniquely optimal range. The fixed 67° control still scored more points with the current routes, so automatic hood control remains optional and off by default.

## Controlled setup

All four robots used the same baseline: fixed rear-facing shooters opposite the front intake, dual release by ball type, four-element capacity, 15-inch square chassis, 22 lb, 600 rpm drivetrain, 95% intake reliability, default AUTO and TELEOP trees, no defense, no dual intake or dual-ended shooter, no turret. Launch speed, spin, release height, and shot variation were unchanged. Automatic configurations shared a 67° starting/preferred angle (clamped into travel), 120°/s hood speed, 20 Hz aiming updates, and 0.25° settling tolerance. Only hood mode/angle/range varied. Qualification rules, deterministic CELL staging, no referee, and full matches were held constant.

Seeds were `1001 + 37*k`. Screening compared 21 automatic ranges and two fixed-angle controls on the first 8 seeds; three automatic finalists used 24 seeds, including those 8 screening seeds. The fixed 67° baseline used the same 24 seeds. This is 280 completed matches, not an exhaustive search or independent holdout validation. Shot-error standard deviations were held fixed, rather than varied as a separate spread multiplier.

## 24-seed results

The primary metric is red + blue combined match points; per-alliance averages divide that by two. SE is the standard error across match seeds.

| Hood | Combined points | SE | Average per alliance | Combined AUTO points | Combined TIPS |
| --- | ---: | ---: | ---: | ---: | ---: |
| Fixed 67° | 819.1 | 7.0 | 409.5 | 172.2 | 37.8 |
| Automatic 55–66° | 767.7 | 6.5 | 383.8 | 127.8 | 35.3 |
| Automatic 20–65° | 767.2 | 8.6 | 383.6 | 112.6 | 35.1 |
| Automatic 55–65° | 763.3 | 9.7 | 381.6 | 112.4 | 35.1 |

Paired differences, using each seed’s combined score:

- Automatic 55–66° minus fixed 67°: **-51.4 ± 9.4** combined points (paired SE, n=24). Approximate 95% interval: [-70.9, -31.9].
- Automatic 55–66° minus automatic 20–65°: **+0.5 ± 9.8** combined points (paired SE, n=24). Approximate 95% interval: [-19.9, 20.8].
- Automatic 55–66° minus automatic 55–65°: **+4.4 ± 11.8** combined points (paired SE, n=24). Approximate 95% interval: [-20.0, 28.8].

The automatic range’s loss against fixed 67° is concentrated in AUTO: 127.8 versus 172.2 combined AUTO points. The existing AUTO paths were tuned for the fixed launcher; automatic mode also adds a scoring-preview readiness gate. These experiments measure the complete resulting behavior, without isolating those causes. Drive strategy and launch-position selection were retained. The planner still drives to its chosen launch spots; this is not a shoot-from-anywhere planner.

## Eight-seed screening

| Range / control | Combined points | SE | Combined AUTO points |
| --- | ---: | ---: | ---: |
| fixed-67 | 815.3 | 11.9 | 166.4 |
| 20-65 | 797.4 | 17.1 | 126.4 |
| 55-65 | 782.4 | 14.2 | 128.3 |
| 45-65 | 782.4 | 14.2 | 128.3 |
| 55-66 | 769.1 | 10.1 | 124.5 |
| 60-66 | 764.1 | 11.6 | 134.5 |
| 55-67 | 760.1 | 21.4 | 139.5 |
| 60-65 | 757.3 | 21.3 | 128.9 |
| fixed-65 | 753.5 | 13.7 | 122.0 |
| 60-70 | 714.1 | 17.0 | 139.5 |
| 60-64 | 713.3 | 17.6 | 74.5 |
| 55-75 | 709.5 | 13.4 | 139.5 |
| 55-64 | 709.1 | 9.3 | 74.5 |
| 60-75 | 703.5 | 15.2 | 129.5 |
| 65-70 | 695.6 | 11.1 | 127.0 |
| 65-75 | 695.0 | 12.9 | 134.5 |
| 60-80 | 671.8 | 16.2 | 139.5 |
| 20-80 | 671.8 | 16.2 | 139.5 |
| 65-80 | 671.4 | 17.5 | 129.5 |
| 50-63 | 667.9 | 11.4 | 72.0 |
| 55-63 | 665.0 | 9.5 | 72.0 |
| 55-80 | 647.4 | 15.4 | 137.0 |
| 70-80 | 573.1 | 10.4 | 105.8 |

## Implementation and limits

`src/sim/hood.ts` solves a bounded shot angle to the raised mouth using stationary gravity/drag integration, with separate POLLEN and NECTAR speeds/masses. `src/sim/world.ts` moves each robot’s hood at the configured rate, uses its actual angle for previews and launches, and blocks automatic shooting until it settles and the preview scores. Hypothetical launch-position previews use the solved angle, allowing the existing planner to choose a compatible spot. AUTO’s `shooter.shoot` leaf yields through the subsystem’s `aimed` flag; TELEOP uses `Shooter.canShoot`.

The live simulation includes backspin lift, while the existing preview and hood angle solver omit it. CELL motion, random launch error, lateral release offsets, and collisions can also make a predicted scoring shot miss. The controller assumes access to the simulated mouth pose and does not model camera-estimation error. The 20–80° overall limits and actuator speed are design assumptions; these results do not establish what the pictured CAD mechanism can physically reach. A wider allowed range does not guarantee a higher score under this aiming policy.

Robot settings expose automatic mode, minimum, maximum, speed, and the fixed/starting angle. Settings persist and changing them resets the field. The live HUD shows actual and target angle plus readiness. No physical hood mesh has been added to the robot model.

## Reproduce and inspect

```sh
node --import tsx scripts/hood-sweep.ts 24 6 my-range-check 'fixed:67,55:65,55:66,20:65'
```

Raw per-seed scores are in `experiments/policy-loop.jsonl`. Configuration and ranking artifacts:

- `experiments/hood-screen-20261008.json`
- `experiments/hood-refine-20261008.json`
- `experiments/hood-validation-20261008.json`
- `experiments/hood-validation-nearby-20261008.json`

The fixed-angle baseline’s first eight seed scores matched the post-change fixed control exactly. Automated tests cover range normalization, drag-aware inversion, distance response, travel limits, finite movement speed, AUTO behavior-tree waiting/firing, unreachable targets, NECTAR aiming, per-robot isolation, and the actual ball’s release angle. The browser controls and live angle indicator were checked in Zen.

Final verification: `npm test` passed all 133 tests, `npm run build` passed, and `python3 scripts/build-site.py` regenerated the result pages. A repeat test run under heavy sweep-worker load hit a Vitest RPC timeout; the final run after the workers completed passed normally.
