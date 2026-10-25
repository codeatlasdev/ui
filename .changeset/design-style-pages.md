---
"@codeatlasdev/ui": minor
---

Design style pages (#583): `/styles/<id>/` for `swiss`, `editorial`, `brutalism`, `sketchbook`, `glassmorphism` and `terminal`, each rendered in its own style, with the origin, the traits (type, colour, shape, depth, motion), do and don't, accessibility pitfalls with their sources, before and after on real components, the `designStyle()` recipe and a prompt. The `ca-ui-mcp` server gains `get_style` (a style as markdown, or the digest of all of them) and `llms.txt` links the digest at `/llms/styles.txt`. `designDefaults()` is exported: the stylesheet default of every knob a theme can write, so a scoped preview can reset what an outer theme set.
