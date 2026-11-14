---
"@codeatlasdev/ui": minor
---

`SegmentedControl` and `ToggleGroup` are generic over their values (#1235): `T` is inferred from `items`, so options typed as a literal union (`"support" | "connect"`) give `value: T` and `onchange: (value: T) => void` instead of `string`, and no narrowing by hand. `ToggleGroup` types `value`/`onchange` by `type`: `T | ''` for single (`''` once cleared), `T[]` for multiple. `ToggleGroupItem<T>` defaults to `string`, so existing code type-checks unchanged.
