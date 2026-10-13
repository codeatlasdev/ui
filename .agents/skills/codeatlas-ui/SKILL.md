---
name: codeatlas-ui
description: Use when building any UI with @codeatlasdev/ui — components, layouts, pages, navigation.
globs: ["**/*.svelte", "**/routes/**/*.svelte", "**/components/**/*.svelte"]
alwaysApply: false
---

# @codeatlasdev/ui

Svelte 5 UI framework. Components are self-contained and prop-driven. Compose them like Lego — don't fight them with CSS.

## When to use
- Building any Svelte page or component that imports from `@codeatlasdev/ui`
- Choosing the right page layout (AppList vs AppForm vs AppSettings vs PageShell)
- Setting up AppShell navigation
- Adding charts, tables, forms, overlays

## Non-negotiable rules

1. **Never write layout CSS.** Use `Grid`, `Row`, `Stack` with gap/cols props.
2. **Never use arbitrary colors.** Use `--ca-*` semantic tokens or component variants.
3. **Never add `padding:` or `margin:` inline.** Use component props or `--ca-space-N` tokens.
4. **Never put AppShellLayout in a shared layout.** Only in authenticated route layouts (e.g. `painel/+layout.svelte`).
5. **CSS imports go once, in the root layout only.**
6. **Import from `@codeatlasdev/ui`** — never from internal paths like `../../../components/Button`.
7. **Never combine `will-change: transform` with `backdrop-filter`.** Kills glass blur.

## Setup (root layout, once)

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import '@codeatlasdev/ui/styles/global.css';
  // global.css already includes materials.css, themes and utilities
  import { colorScheme } from '@codeatlasdev/ui';
  import { onMount } from 'svelte';
  let { children } = $props();
  onMount(() => colorScheme.init());
</script>
{@render children()}
```

```ts
// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import { caThemePlugin } from '@codeatlasdev/ui/vite';
// caThemePlugin: anti-FOUC script + ssr.noExternal for @tanstack/svelte-table and shiki
export default defineConfig({ plugins: [sveltekit(), caThemePlugin()] });

// src/hooks.server.ts: injects the theme script into SSR/prerendered pages
import { sequence } from '@sveltejs/kit/hooks';
import { caThemeHandle } from '@codeatlasdev/ui/kit';
export const handle = sequence(caThemeHandle());
```

Product with its own brand color? Pass the same `ThemeOptions` to both: `caThemeHandle(theme)` and `caThemePlugin(theme)`, with `theme = { presets: [{ id: "acme", color: "#2563eb" }], defaultPreset: "acme", defaultScheme: "system" }`. The full light/dark token set is generated from the hex. Put the logo in `AppShellLayout` with `{#snippet brand()}`.

## Heavy components live in subpaths

Charts, DataTable and CodeSnippet are NOT in the root import. Each needs its own peer installed.

| import from | components | install |
|---|---|---|
| `@codeatlasdev/ui/charts` | `LineChart` `BarChart` `PieChart` `ScatterChart` `HeatmapChart` `GaugeChart` `RadarChart` `Sparkline` + chart types | `echarts` |
| `@codeatlasdev/ui/table` | `DataTable*`, `Table`, `createCaTable`, `createCaColumnHelper`, `caTableFeatures`, `PaginationState`, `SortingState` | `@tanstack/svelte-table` |
| `@codeatlasdev/ui/code` | `CodeSnippet` | `shiki` |

`SimpleTable` and `UserCell` stay in the root import and need nothing extra.

## Look up the real API before writing a prop

Never guess a prop name. Two sources, both generated from the source types:

1. **MCP server (preferred).** `ca-ui-mcp` answers `get_component("Button")` (props, defaults, snippets, `ca-*` classes), `list_components`, `search_tokens("safe-bottom")` and `get_guide("theming")`. Setup: `claude mcp add codeatlas-ui -- npx -y -p @codeatlasdev/ui ca-ui-mcp`.
2. **[API.md](./API.md)** — the same data as one markdown file (offline fallback; large, search it instead of reading it whole). Regenerate with `bun run --cwd packages/ui manifest -- --skill` after changing a component.

## Mobile, theme, SEO

- **Mobile.** Heights use `var(--ca-vh)`, never `100vh`/`100dvh`. Fixed UI pads with `var(--ca-safe-*)`. Keyboard-aware forms use `use:keyboardAware` (`@codeatlasdev/ui/actions`). Full-screen mobile screens are `MobilePane`, sticky form bars are `StickyActions`. Never write a 44px touch override: it is global under `(pointer: coarse)`.
- **Theme.** One `ThemeOptions` object in `src/lib/theme.ts`, passed to `caThemeHandle`/`caThemePlugin` (SvelteKit) or `caUI` (Astro). Keep it a plain object with a type-only import so config files can load it in Node. Override tokens by declaring `--ca-*` on `:root`, no `!important`. Local dark/light islands: `data-theme-scope="dark|light"`.
- **Setup.** `bunx @codeatlasdev/ui init` wires all of the above into a fresh SvelteKit or Astro app and never overwrites a file (it prints a diff; `--write` applies it).
- **SEO.** Public pages use `<Seo>` from `@codeatlasdev/ui/seo` with `canonical`; private pages pass `noindex`.

## Companion files

- [LAYOUT.md](./LAYOUT.md) — Grid, Row, Stack — all props and composition patterns
- [PAGE-TEMPLATES.md](./PAGE-TEMPLATES.md) — AppList, AppForm, AppSettings, PageShell
- [APPSHELL.md](./APPSHELL.md) — navigation shell setup
- [COMPONENTS.md](./COMPONENTS.md) — Button, inputs, display, overlays — curated usage examples
- [API.md](./API.md) — generated props, defaults and classes for every component
- [ANTIPATTERNS.md](./ANTIPATTERNS.md) — explicit don'ts with corrected alternatives
