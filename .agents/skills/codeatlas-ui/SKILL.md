---
name: codeatlas-ui
description: "Use when building any UI with @codeatlasdev/ui: components, layouts, pages, navigation."
globs: ["**/*.svelte", "**/routes/**/*.svelte", "**/components/**/*.svelte"]
alwaysApply: false
---

# @codeatlasdev/ui

Svelte 5 UI framework. Components are self-contained and prop-driven. Compose them like Lego, don't fight them with CSS.

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
6. **Import from `@codeatlasdev/ui`**, never from internal paths like `../../../components/Button`.
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
// src/lib/theme.ts: the one ThemeOptions object shared by the plugin and the hook
import type { ThemeOptions } from '@codeatlasdev/ui';
export const theme: ThemeOptions = {
  presets: [{ id: 'acme', color: '#2563eb' }],
  defaultPreset: 'acme',
  defaultScheme: 'system',
};

// vite.config.ts (import with the .ts extension: Vite's native config loader needs it)
import { sveltekit } from '@sveltejs/kit/vite';
import { caErrorPlugin, caThemePlugin } from '@codeatlasdev/ui/vite';
import { theme } from './src/lib/theme.ts'; // keep the .ts extension: Vite 8's native config loader needs it
// caThemePlugin: anti-FOUC script + ssr.noExternal for @tanstack/svelte-table and shiki
// caErrorPlugin: scaffolds +error.svelte and error.html once, never overwrites. Order in `plugins` does not matter.
export default defineConfig({
  plugins: [sveltekit(), caThemePlugin(theme), caErrorPlugin({ scaffold: true })],
});

// src/hooks.server.ts: theme script in SSR/prerendered pages + sanitized server errors
import { sequence } from '@sveltejs/kit/hooks';
import { caThemeHandle, createErrorHandler } from '@codeatlasdev/ui/kit';
import { theme } from './lib/theme.ts';
export const handle = sequence(caThemeHandle(theme));
export const handleError = createErrorHandler();
```

Always pass the same `theme` to `caThemeHandle(theme)` and `caThemePlugin(theme)`: called with no argument they fall back to the default brand and ignore your presets. `bunx @codeatlasdev/ui init` writes exactly this (plus `src/lib/theme.ts`, the layout and the viewport meta). Product with its own brand color? Put it in the shared `theme`: `{ presets: [{ id: "acme", color: "#2563eb" }], defaultPreset: "acme", defaultScheme: "system" }`. The full light/dark token set is generated from each preset's hex. Put the logo in `AppShellLayout` with `{#snippet brand()}`.

### SvelteKit 3 (peer allows `^2.12.0 || ^3.0.0`)

Check `@sveltejs/kit` in `package.json` before writing setup code. On Kit 3:

- `svelte.config.js` is ignored and has no `kit` namespace: pass `adapter` and the rest straight to `sveltekit({ adapter: adapter() })` in `vite.config.ts`.
- `tsconfig.json` must be `{ "extends": "$app/tsconfig" }` (`.svelte-kit/tsconfig.json` is gone).
- `$lib` is removed: import app code as `#lib/...` with the extension (`#lib/theme.ts`; needs `"imports": { "#lib/*": "./src/lib/*" }` in `package.json`, which `sv create` writes), or use a relative path.
- Import the theme in `vite.config.ts` **with the `.ts` extension** (`./src/lib/theme.ts`), on Kit 2 and 3: Vite's native config loader rejects extensionless imports.

`bunx @codeatlasdev/ui init` reads the installed Kit version and does the `#lib` part; it only reports the `svelte.config.js` and tsconfig changes.

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
2. **[API.md](./API.md)**: the same data as one markdown file (offline fallback; large, search it instead of reading it whole). Regenerate with `bun run --cwd packages/ui manifest -- --skill` after changing a component.

## Mobile, theme, SEO

- **Mobile.** Heights use `var(--ca-vh)`, never `100vh`/`100dvh`. Fixed UI pads with `var(--ca-safe-*)`. Keyboard-aware forms use `use:keyboardAware`. Full-screen mobile screens are `MobilePane`, sticky form bars are `StickyActions`. Never write a 44px touch override: it is global under `(pointer: coarse)`.
- **Opening a view with a text field (dialog, sheet, search).** iOS only opens the keyboard for `focus()` called synchronously inside the tap. In the tap handler call `primeKeyboard()` first, then open the view, and mark the real field `use:autofocus`: `<Button onclick={() => { primeKeyboard(); open = true; }}>`. On touch, `autofocus` and `focusTextField` only focus after `primeKeyboard()` (no half-focused field without a keyboard); pass `{ touch: true }` to force it. No-op with a mouse. Never hand-roll `setTimeout(() => input.focus())`.
- **Streaming, external links, export.** Rows arriving over time are a `LiveList` (polite batched announcements, follow-the-tail that pauses when the user scrolls up, never moves focus; no `StatusChip`/live regions inside rows). External links are `ExternalLink` (rel, icon, localised "opens in a new tab"), not a hand-written `target="_blank"`. A CSV/JSON download is `ExportMenu` or `toCsv`/`toJson`/`downloadFile`.
- **Theme.** One `ThemeOptions` object in `src/lib/theme.ts`, passed to `caThemeHandle`/`caThemePlugin` (SvelteKit) or `caUI` (Astro). Keep it a plain object with a type-only import so config files can load it in Node. Override tokens by declaring `--ca-*` on `:root`, no `!important`. Local dark/light islands: `data-theme-scope="dark|light"`.
- **Setup.** `bunx @codeatlasdev/ui init` wires all of the above into a fresh SvelteKit or Astro app and never overwrites a file (it prints a diff; `--write` applies it).
- **SEO.** Public pages use `<Seo>` from `@codeatlasdev/ui/seo` with `canonical`; private pages pass `noindex`.
- **A11y tests.** `await expectNoA11yViolations(container)` from `@codeatlasdev/ui/testing` in every state (open, error, empty, light, dark); needs the optional peer `axe-core`.

## Actions (`@codeatlasdev/ui/actions`)

Import from the subpath, never copy the logic. Every export:

| export | use |
|---|---|
| `autofocus` | `use:autofocus` on the field of a view that just opened; touch-safe (see Mobile above) |
| `primeKeyboard` | helper, not an action: call in the tap handler that opens a view with an autofocused field |
| `focusTextField` | `focusTextField(el, force?)`: the focus logic behind `autofocus`, for imperative focus |
| `keyboardAware` | `use:keyboardAware` on forms and composers: keeps the focused field above the on-screen keyboard |
| `focusTrap` | `use:focusTrap={open}` on custom overlays (Dialog and Sheet already trap focus) |
| `clickOutside` | `use:clickOutside={() => close()}` for custom popovers |
| `clipboard` | `use:clipboard={text}` copies on click and fires `copy` (prefer `CopyButton`) |
| `longpress` | `use:longpress={500}` fires `longpress` after the pointer is held for that many ms |
| `scrollFocusable` | `use:scrollFocusable` on a scroll container: tab stop only while it overflows |

## Companion files

- [LAYOUT.md](./LAYOUT.md): Grid, Row, Stack, all props and composition patterns
- [PAGE-TEMPLATES.md](./PAGE-TEMPLATES.md): AppList, AppForm, AppSettings, PageShell
- [APPSHELL.md](./APPSHELL.md): navigation shell setup
- [COMPONENTS.md](./COMPONENTS.md): Button, inputs, display, overlays, curated usage examples
- [API.md](./API.md): generated props, defaults and classes for every component
- [ANTIPATTERNS.md](./ANTIPATTERNS.md): explicit don'ts with corrected alternatives
