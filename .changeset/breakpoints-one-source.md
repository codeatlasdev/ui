---
"@codeatlasdev/ui": minor
---

Breakpoints from one source: opt-in `@codeatlasdev/ui/styles/breakpoints.css` declares `@custom-media --ca-sm|md|lg|xl` and `--ca-below-*` from the same scale as `BREAKPOINTS`; the lint `breakpoint` rule enforces `max-width` 0.02px below a step and suggests the fix.
