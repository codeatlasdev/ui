---
"@codeatlasdev/ui": minor
---

PasswordStrength: `layout="inline"` (bar and label on one row), `hideWhenEmpty` (nothing drawn at score 0; the live region stays mounted so the first announcement works) and the tokens `--ca-pwstrength-gap`, `--ca-pwstrength-empty-bg`, `--ca-pwstrength-label-leading`, `--ca-pwstrength-label-tracking` with the `ThemeOptions.components.passwordStrength` block. Defaults render as before.
