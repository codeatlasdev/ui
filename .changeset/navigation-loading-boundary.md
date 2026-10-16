---
"@codeatlasdev/ui": minor
---

Navigation: `LoadingBoundary` wraps `<svelte:boundary pending>` with a 200 ms delay and 500 ms minimum so a loading UI never flashes (default placeholder is `Skeleton` rows, `aria-busy`, named region). `@codeatlasdev/ui/kit` gains `NavigationProgress` (top bar driven by `navigating` from `$app/state`) and the `pendingLink()` attachment that sets `data-pending` on the link being navigated to. A test now proves AppShell stays mounted across 10 client-side navigations.
