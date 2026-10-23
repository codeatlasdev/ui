---
"@codeatlasdev/ui": minor
---

Display text role (#350). New `Heading` component (`level`, `size="display" | "display-2" | "display-3" | "h1".."h6"`) bound to `--ca-font-display` (the body font until `fonts.display` is set), the new `--ca-display-tracking` / `--ca-display-leading` tokens and the fluid `--ca-font-size-display-*` sizes. `AuthCard`, `PageShell`, `EmptyState` and `SiteHeader` take a `display` prop. `defineTheme({ typography: { displayTracking, displayLeading } })` sets the tokens.
