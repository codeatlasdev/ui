---
"@codeatlasdev/ui": patch
---

`PageShell` actions below 900px: a lone icon-only control (`IconButton`, `ThemeToggle`) no longer stretches to the full row with its icon centred. Icon-only children (`.ca-icon-btn`, `.ca-rail-btn`) keep their natural size and sit at the end of the row; labeled buttons still share the row full-width as before.
