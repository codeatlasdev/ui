---
"@codeatlasdev/ui": minor
---

The reset layer (`@layer ca.reset`) now gives every interactive shape a pointer cursor: `button`, `a[href]`, `label[for]`, `summary`, `[role=button]`, `[role=tab]`, `[role=option]` and `[role=menuitem*]`. `:disabled` and `[aria-disabled=true]` get `not-allowed`. A custom clickable tile no longer shows the arrow cursor; an app overrides the rule with an unlayered `cursor` declaration, no `!important`. The stylesheet drops the now redundant `cursor: pointer` of `.glass-btn*` and `.ca-rail-btn`, the unused `.ca-bar__actions` rule and the unused `--ca-grid-columns` token to stay inside its 17250 B budget.
