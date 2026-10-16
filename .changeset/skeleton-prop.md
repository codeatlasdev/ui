---
"@codeatlasdev/ui": minor
---

`skeleton` prop on `Avatar`, `KpiCard`, `TextField`, `Table`, `Card` and `GlassCard`: the component keeps its real DOM, so the placeholder has exactly the loaded size (no layout shift). Content is laid out but hidden, the host paints the same shimmer as `<Skeleton>`, and it is announced with `aria-busy="true"`; a skeleton `TextField` is disabled and an `Avatar` makes no image request. Reduced motion stops the sweep and forced colors draw an outline. New global `[data-skeleton]` rule and `ca-shimmer` keyframes in `utilities.css`.
