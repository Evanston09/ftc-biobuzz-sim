# Calibrated hood range spread — October 8, 2026

Reran full-match range sweeps after implementing the experimental distance→angle table and preserving
fixed-reference launch positions. All four robots use identical baseline builds, rear-facing dual
shooters, front-only intakes, no turret, and a 120°/s hood. Only automatic mode and its travel limits
vary. The calibrated table and launch variation remain unchanged. Seeds are paired: `1001 + 37*k`.

## Eight-seed screen

| Mode / travel limits | Combined points | SE | Combined AUTO |
|---|---:|---:|---:|
| Fixed 67° | 815.3 | 11.9 | 166.4 |
| Calibrated 50–65° | 732.8 | 14.0 | 121.4 |
| Calibrated 50–66° | 811.9 | 14.5 | 161.4 |
| Calibrated 50–67° | 811.0 | 13.5 | 166.4 |
| Calibrated 50–70° | 811.1 | 13.7 | 166.4 |
| Calibrated 50–75° | 811.1 | 13.7 | 166.4 |
| Calibrated 50–80° | 811.1 | 13.7 | 166.4 |
| Calibrated 65–80° | 811.1 | 13.7 | 166.4 |
| Calibrated 70–80° | 775.3 | 16.6 | 143.9 |

Combined points sum red and blue; divide by two for mean alliance points. The 50–65° cap loses
82.5 combined points against fixed, paired SE 10.2 (n=8). This is a substantial difference from allowing
66°: 50–66° gains 79.1 combined points against 50–65° on the same seeds.

Allowing higher angles no longer causes the earlier gravity/drag solver's large loss: the table
requests measured angles, so extra mechanical travel does not force higher trajectories. The 50–70°,
50–75°, 50–80°, and 65–80° runs have identical per-seed scores. The 70° minimum instead clamps most table
values upward; its observed loss against fixed is 40.0 combined points, paired SE 22.1, so that estimate
is less certain. These are travel-limit experiments, not shots at every individual angle in the range.

## Twenty-four-seed validation

| Mode / travel limits | Combined points | SE | Combined AUTO |
|---|---:|---:|---:|
| Fixed 67°, existing paired reference | 819.1 | 7.0 | 172.2 |
| Calibrated 50–66°, new run | 805.1 | 7.8 | 163.3 |
| Calibrated 50–67°, new run | 804.8 | 6.1 | 171.4 |
| Calibrated 55–80°, existing paired reference | 806.7 | 7.6 | 171.4 |

50–66° and 50–67° score 402.5 and 402.4 mean alliance points, calculated from raw per-seed scores.
Their difference is −0.3 combined points for 50–67°, paired SE 10.8 (n=24): no meaningful winner.
Against fixed, 50–66° loses 14.0 ± 11.4 paired combined points; 50–67° loses 14.3 ± 6.7.
The wider existing 55–80° calibrated run scores 403.4 per alliance, versus fixed's 409.6 (rounded
from the published combined summaries). It remains an optional mechanism rather than a demonstrated
scoring improvement. No shooter or planner defaults were changed by this sweep.

The sweep script now accepts an optional fifth argument `calibrated`; omitting it still reproduces
the earlier `ballistic` range experiments. The reported setup records the actual selected mode.

## Reproduce

```sh
node --import tsx scripts/hood-sweep.ts 8 6 hood-calibrated-spread-20261008 'fixed:67,50:65,50:66,50:67,50:70,50:75,50:80,65:80,70:80' calibrated
node --import tsx scripts/hood-sweep.ts 24 6 hood-calibrated-spread-validation-20261008 '50:66,50:67' calibrated
```

Raw rows and per-seed scores are in `hood-calibrated-spread-20261008.json`,
`hood-calibrated-spread-validation-20261008.json`, and `policy-loop.jsonl`.
The original table fitting protocol is in [hood-calibration.md](hood-calibration.md).
