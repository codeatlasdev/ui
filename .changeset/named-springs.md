---
"@codeatlasdev/ui": minor
---

Named springs (#1228): `springs.snappy` (damping 12, stiffness 200, mass 0.1), `springs.soft` and `springs.bouncy`, exported by the root and `@codeatlasdev/ui/tokens`. `springCurve(name)` turns a spring into a CSS `linear()` easing and its settle duration for WAAPI, `springTween(name)` into an easing function for Svelte's `Tween` and transitions, and `nearestSpring(config)` maps an existing `{ damping, stiffness, mass }` onto a preset. CSS gets `--ca-spring-<name>` and `--ca-spring-<name>-duration` in the opt-in sheet `@codeatlasdev/ui/styles/springs.css` (`ca.tokens` layer; not in `global.css`, so its size is unchanged). Under `prefers-reduced-motion` every spring resolves to 0 ms (`--ca-motion-scale: 0`, and `duration: 0` from the helpers).
