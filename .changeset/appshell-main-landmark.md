---
"@codeatlasdev/ui": minor
---

`AppShellLayout` renders its content region as `<main id={mainId} tabindex="-1">` by default, so a page built on it has a `<main>` landmark (axe `landmark-one-main`, `region`) and the skip link lands on it. It was a plain `div`. Pass `mainId={null}` when your page renders its own `<main id="main" tabindex="-1">`: the region is then a plain `div`, never a second landmark. If you wrapped your content in `<main>` inside the shell, remove it or pass `mainId={null}`.
