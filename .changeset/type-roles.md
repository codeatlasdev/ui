---
"@codeatlasdev/ui": minor
---

A named type scale by role. `title`, `heading`, `body`, `label`, `caption` and `num` are size / leading / tracking / weight bundles (`--ca-text-<role>-size|leading|tracking|weight`, and `--ca-text-<role>` as a `font` shorthand), applied with `<Text role>` or `.ca-text-<role>`; `num` renders tabular digits so a ticking counter never shifts its neighbours. `ThemeOptions.type = { label: { size: "13px", leading: 1.25, tracking: "0", weight: 500 } }` overrides any part for the whole app, library components included: `--ca-font-size-label`, `-body1`, `-caption` and `--ca-label-tracking` are now derived from the roles, with the same default values, so existing components follow without edits. Unknown roles and values that are not a length, number or keyword throw at build time.
