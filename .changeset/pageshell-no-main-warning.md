---
"@codeatlasdev/ui": patch
---

`PageShell` and `PageFrame` warn once in development when the page has no `<main>` landmark (no `main`/`[role=main]` ancestor and none in the document), pointing at the Standalone page recipe. Silent inside `AppShellLayout`, `AuthLayout`, `DocsShell` or your own `<main>`. `llms.txt` lists Standalone page first under "Start here".
