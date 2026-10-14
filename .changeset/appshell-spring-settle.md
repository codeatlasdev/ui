---
"@codeatlasdev/ui": patch
---

AppShellLayout: the panel/main offset now uses the Svelte 5 `Spring` class and lands on the exact target (252px, not 251.984px). The extra CSS `margin-left` transition that lagged the spring is gone, and `prefers-reduced-motion` skips the animation and jumps straight to the target.
