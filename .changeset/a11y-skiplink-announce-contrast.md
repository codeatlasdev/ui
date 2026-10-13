---
"@codeatlasdev/ui": minor
---

Accessibility foundations.

- New `SkipLink` component (`ca-skip-link`). `AppShellLayout`, `DocsShell` and `AuthLayout` render it as the first tab stop and own the `#main` target. `DocsShell` keeps its `ca-docs-skip` class and `docs.skipToContent` label, but its `<main>` id is now `main` (was `ca-docs-content`): update any CSS or links that targeted `#ca-docs-content`. `AppShellLayout` gets `mainId` (default `"main"`; pass `null` when your page renders its own `<main id="main" tabindex="-1">`) and `skipLink` (set `false` when the shell is embedded in a page that already has one).
- New `announce(message, politeness)` backed by one shared live region. `CopyButton` now announces through it (its local `ca-copy__status` element is gone), and `Button`/`IconButton` announce "Finished loading" when `loading` ends. New `RouteAnnouncer` in `@codeatlasdev/ui/kit` announces SvelteKit navigations (document title, or the page `<h1>`).
- `forced-colors: active` support: glass, blur and shadows are removed, surfaces get a `CanvasText` border and focus uses `Highlight`.
- `prefers-contrast: more` tokens (text-secondary and text-hint at 7:1 or more, outlines at 3:1 or more) are emitted per preset by the theme generator, so built-in and brand presets from `defineTheme` both get them. Built-in theme CSS is regenerated.
- `Combobox` gets an `ariaLabel` prop to name the control when there is no visible `label`.
