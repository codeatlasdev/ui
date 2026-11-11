---
"@codeatlasdev/ui": minor
---

`AppForm`, `AppSettings` and `PageFrame mode="page"` take an `aside` snippet (plus `asideLabel`, `asideWidth`, default `20rem`): a companion column beside the content from a 1280px page (sticky at the top, an `<aside>` landmark) and after the content below that, so a wide desktop no longer leaves half the page empty. `CardGrid` takes `minItemWidth` (default `16rem`) for an auto-fill grid with more or fewer columns. Pages without an `aside` render exactly as before.
