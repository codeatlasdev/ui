---
"@codeatlasdev/ui": minor
---

`Button` and `IconButton` get `tone="neutral"` (#357): `outlined` and `ghost` buttons drawn with a neutral label, border and hover/pressed fills instead of the brand colour, for secondary actions beside a brand `filled` one. `IconButton` also gets the `outlined` variant. Label and border contrast is checked for every preset in `tests/contrast.test.ts`.
