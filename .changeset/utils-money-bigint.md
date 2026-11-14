---
"@codeatlasdev/ui": minor
---

New subpath `@codeatlasdev/ui/utils/money`: integer arithmetic on minor units, computed in `bigint` and free of Svelte code. `sumCents`, `multiplyCents(amount, rate, mode)`, `applyBasisPoints(amount, bps, mode)`, `divRound(n, d, mode)` / `divRoundHalfUp`, `allocateByWeights(total, weights)` (the shares always sum to the total; leftover cents go to the largest remainders, ties to the earlier share) and `assertCents`. A `number` amount gives a `number` result and a `bigint` a `bigint`; a `number` result past `Number.MAX_SAFE_INTEGER` throws instead of rounding. Rounding modes use the names of `Intl.NumberFormat`'s `roundingMode` (default `halfExpand`, a tie away from zero). The `@codeatlasdev/ui/forms` money helpers are unchanged.
