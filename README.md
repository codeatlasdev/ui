<div align="center">

# @codeatlasdev/ui

**full screens for svelte 5. any design style. one theme object.**<br>
built so you, or your AI agent, ship the page today and not next sprint.

[![npm](https://img.shields.io/npm/v/@codeatlasdev/ui?style=flat-square&color=f59e0b)](https://www.npmjs.com/package/@codeatlasdev/ui)
[![license](https://img.shields.io/npm/l/@codeatlasdev/ui?style=flat-square)](https://github.com/codeatlasdev/ui/blob/main/LICENSE)
[![svelte](https://img.shields.io/badge/svelte-5_runes-ff3e00?style=flat-square)](https://svelte.dev)
[![deps](https://img.shields.io/badge/headless_deps-0-22c55e?style=flat-square)](#own-primitives)

[docs + live demo](https://ui.codeatlas.com.br) · [theme editor](https://ui.codeatlas.com.br/theme/) · [llms.txt](https://github.com/codeatlasdev/ui/blob/main/llms.txt) · [agent guide](https://github.com/codeatlasdev/ui/blob/main/AGENTS.md)

</div>

---

## tl;dr

```svelte
<AppList title="Users" data={users} searchKeys={['name', 'email']}>
  {#snippet children(list)}
    <SimpleTable responsive="cards">
      <thead><tr><th>User</th><th>Role</th></tr></thead>
      <tbody>
        {#each list.rows as u (u.id)}
          <tr><td><UserCell name={u.name} email={u.email} /></td><td>{u.role}</td></tr>
        {/each}
      </tbody>
    </SimpleTable>
  {/snippet}
</AppList>
```

That's a full users page. Search, pagination, empty state, header and actions. On a phone the rows turn into cards with captions taken from your headers. You wrote zero CSS.

Most UI kits give you a button and wish you luck. This one gives you the page, and lets you restyle it into any design language without touching a component.

## the 30 second mental model

1. **Pages, not bricks.** `AppList`, `AppForm`, `AppSettings`, `AppShellLayout`, `AuthLayout`, `DocsShell`. Layout, spacing, empty and loading states come with them.
2. **Everything visual is a token.** Spacing, radius, type, weights, borders, shadows, motion, materials. Components only read `--ca-*` variables, never raw pixels. A lint fails the build if one sneaks in.
3. **One theme object drives the tokens.** `defineTheme()` works like MUI's `createTheme`: you describe the theme, the lib writes the CSS once, before first paint.
4. **Design styles are recipes.** Swiss, brutalism, glass, Material 3… each one is just a `defineTheme` input. Same components, different language.
5. **The core guarantees the boring stuff.** No overlapping text, no sideways scroll, 44px touch targets, AA/AAA text contrast, focus never hidden behind sticky bars. There are tests for all of it.

## install

```sh
bun add @codeatlasdev/ui    # npm i / pnpm add work too
```

The core is light. Heavy features are opt-in subpaths with optional peers:

| want | import from | also install |
|---|---|---|
| charts | `@codeatlasdev/ui/charts` | `echarts` |
| DataTable | `@codeatlasdev/ui/table` | `@tanstack/svelte-table` |
| CodeSnippet | `@codeatlasdev/ui/code` | `shiki` |

Fastest setup, for SvelteKit or Astro:

```sh
bunx @codeatlasdev/ui init          # shows what it would write
bunx @codeatlasdev/ui init --write  # writes the missing files, never overwrites yours
```

Prefer doing it by hand? SvelteKit is three files (SvelteKit 3: pass `adapter` and friends to `sveltekit({ ... })` instead of `svelte.config.js`, and extend `$app/tsconfig`; see the [installation guide](https://ui.codeatlas.com.br/docs/getting-started/installation/#sveltekit-3)):

```ts
// vite.config.ts: theme script in dev + SSR deps sorted, error pages scaffolded once
import { sveltekit } from '@sveltejs/kit/vite';
import { caErrorPlugin, caThemePlugin } from '@codeatlasdev/ui/vite';
import { defineConfig } from 'vite';
import { theme } from './src/lib/theme.ts'; // with the extension: Vite's native config loader needs it

export default defineConfig({
  plugins: [sveltekit(), caThemePlugin(theme), caErrorPlugin({ scaffold: true })],
});
```

```ts
// src/hooks.server.ts: same script for SSR and prerendered pages, sanitized server errors
import { sequence } from '@sveltejs/kit/hooks';
import { caThemeHandle, createErrorHandler } from '@codeatlasdev/ui/kit';
import { theme } from '$lib/theme'; // SvelteKit 3: '#lib/theme.ts' ($lib was removed)

export const handle = sequence(caThemeHandle(theme));
export const handleError = createErrorHandler();
```

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import '@codeatlasdev/ui/styles/global.css';
  import { colorScheme } from '@codeatlasdev/ui';
  import { onMount } from 'svelte';
  let { children } = $props();
  onMount(() => colorScheme.init());
</script>

{@render children()}
```

Astro is one line: `integrations: [svelte(), caUI(theme)]` from `@codeatlasdev/ui/astro`.

Dark mode works, the brand color is there on the first frame, and there's no white flash.

## theming, the MUI way

```ts
// src/lib/theme.ts
import { defineTheme } from '@codeatlasdev/ui';

export const theme = defineTheme({
  presets: [{ id: 'acme', color: '#2563eb' }], // your logo hex, every token derived from it
  defaultPreset: 'acme',
  defaultScheme: 'system',
  radius: 1.2,              // multiplies the whole radius scale
  density: 'compact',       // or 'comfortable' | 'airy' | a number
  typography: { scale: 1.05, weights: { heading: 650 } },
  elevation: 'soft',        // 'soft' | 'none' | 'hard' | 'glow'
  motion: { scale: 0.8, easing: 'emphasized' },
});
```

The knobs cover color, surface material, radius, borders, shadows, type (families, weights, case, tracking, scale, line height, measure), density, motion, icon stroke and grain. Each knob moves a whole scale, so a single change stays consistent across all 90+ components.

Need a dark hero in a light page? Theme islands: `<section data-theme-scope="dark">`. Need a different look in one area? `data-ca-tokens` with its own knobs.

## design styles

Pick a language, override what you want:

```ts
import { defineTheme, designStyle } from '@codeatlasdev/ui';

export const theme = defineTheme(designStyle('editorial', { radius: 0.4 }));
```

| style | vibe |
|---|---|
| `default` | liquid glass, soft depth, Inter |
| `swiss` | grid, hairlines, no shadows, Helvetica energy |
| `brutalism` | thick borders, hard offset shadows, uppercase |
| `neumorphism` | one base color, extruded and pressed surfaces |
| `glassmorphism` | heavy blur over color, bright rims |
| `material` | M3 tonal surfaces, pill controls, emphasized motion |
| `fluent` | acrylic (blur + grain), small radii, compact |
| `apple` | frosted materials, system type, spring motion |
| `bento` | big radii, airy modules |
| `claymorphism` | puffy surfaces, inner highlights, bouncy |
| `y2k` | chrome gloss, metallic rims, glow, bubbly type |
| `editorial` | serif display, quiet surfaces, magazine feel |
| `terminal` | mono everything, outlines, zero radius |

Fields, chips, alerts and cards all follow the style, not only the cards. Every style has a visual test in light and dark, so a token change can't quietly flatten one.

Don't want to write the object? Open the [theme editor](https://ui.codeatlas.com.br/theme/), pick a style, tweak every knob with a live preview, and copy the exact `defineTheme(designStyle(...))` call.

## what the core guarantees

These are tests, not promises:

- **no sideways scroll, no overlap, no unmarked clipping** on every docs page and template at 360, 768, 1024, 1280 and 844×390 landscape.
- **44px touch targets** on touch screens. Controls that look smaller keep their look and get an invisible 44px hit area.
- **text contrast**: primary text ≥ 7:1 and secondary ≥ 4.5:1 on every surface, for any brand hue, light and dark.
- **tables never push the page**: wide tables scroll in their own region, and below 600px of their own width they become aligned cards.
- **focus is never hidden** under sticky headers, bottom navs or the iPhone home bar.
- **mobile done right**: safe areas, dynamic viewport height, keyboard inset from `visualViewport`, no iOS zoom on input focus, zoom never blocked.
- **axe clean** across every route, plus forced-colors and reduced-motion support.

## own primitives

Dialogs, menus, selects, comboboxes, tabs, sliders, date pickers and the rest run on our own headless layer (`src/lib/primitives`). It follows the WAI-ARIA Authoring Practices and uses the platform where it can: native `<dialog>` for modals, native inputs for checkboxes and switches. Positioning uses `@floating-ui/dom`, and date math uses `@internationalized/date`.

The behavior design owes a lot to [Bits UI](https://bits-ui.com) by Hunter Johnston, which powered this library up to 1.2. If you want unstyled building blocks with full control, go use it. It's great.

## AI first, for real

The API is shaped so an LLM gets it right on the first try. The component name says what the screen is, props are data, snippets are the holes you fill. There are no styling decisions left to hallucinate.

```sh
npx skills add codeatlasdev/ui
```

That installs three skills into Claude Code, Cursor, Codex and friends:

| skill | what it teaches |
|---|---|
| `codeatlas-ui` | every component, prop, token and layout rule |
| `codeatlas-dx` | file structure and size limits so the codebase stays clean |
| `codeatlas-writing` | UI copy that doesn't read like a chatbot wrote it |

The package also ships a local MCP server, `ca-ui-mcp`, with `list_components`, `get_component`, `search_tokens` and `get_guide`, served from the generated `components.json`. No skills? Point the agent at [`llms.txt`](https://github.com/codeatlasdev/ui/blob/main/llms.txt) or [`AGENTS.md`](https://github.com/codeatlasdev/ui/blob/main/AGENTS.md).

## what's in the box

| | |
|---|---|
| page templates | `AppList` `AppForm` `AppSettings` `PageShell` `FormSection` `StickyActions` |
| shells | `AppShellLayout` `Rail` `Panel` `SiteHeader` `BottomNav` `MobileHeader` `MobilePane` `AuthLayout` `DocsShell` |
| layout | `Grid` `Row` `Stack` `Divider` |
| data | `DataTable` `SimpleTable` `Pagination` `KpiCard` `KpiGrid` `EmptyState` `FilterGroup` `Timeline` |
| charts | `LineChart` `BarChart` `PieChart` `ScatterChart` `HeatmapChart` `GaugeChart` `RadarChart` `Sparkline` |
| forms | `Button` `TextField` `TextArea` `NumberField` `MaskedField` `Select` `Combobox` `Checkbox` `RadioGroup` `Switch` `Slider` `PinInput` `SegmentedControl` `ToggleGroup` `FileUpload` `useForm` |
| dates | `Calendar` `RangeCalendar` `DateField` `TimeField` `DatePicker` `DateRangePicker` |
| display | `Avatar` `Badge` `Chip` `StatusChip` `Alert` `CodeSnippet` `Kbd` `Stepper` `Image` |
| navigation | `Breadcrumb` `Tabs` `Accordion` `Collapsible` `NotificationBell` `CommandPalette` |
| overlays | `Dialog` `AlertDialog` `Sheet` `Drawer` `Popover` `Tooltip` `DropdownMenu` `Lightbox` |
| feedback | `Toast` `Spinner` `Skeleton` `Progress` `ErrorPage` |
| surfaces | `GlassCard` `GlassSurface` `GlassAppBar` `LiquidGlass` |
| SEO / PWA | `Seo`, JSON-LD builders, sitemap, robots, `llms.txt`, manifest helpers (`@codeatlasdev/ui/seo`) |

Charts take data, not ECharts configs. Colors and fonts follow the active theme, including your brand color.

```svelte
<script>
  import { LineChart } from '@codeatlasdev/ui/charts';
</script>

<LineChart categories={['jan', 'feb', 'mar']} series={[{ name: 'MRR', data: [12, 19, 31] }]} />
```

## where it sits

| | @codeatlasdev/ui | shadcn-svelte | Bits UI |
|---|---|---|---|
| what you get | full screens | copy-paste components | headless primitives |
| page templates + shells | ✅ | ❌ | ❌ |
| design styles from one object | ✅ 13 recipes | edit CSS vars | bring your own |
| CSS you write | basically none | some | all of it |
| layout + a11y guarantees under test | ✅ | partial | behavior only |
| agent skills + MCP | ✅ | ❌ | ❌ |

Want pixel-level control over every primitive? Bits UI. Want the dashboard live today, in whatever style the brand asks for? You're in the right place.

## hacking on it

```sh
git clone https://github.com/codeatlasdev/ui && cd ui
bun install
bun dev            # builds the lib, then the docs site
bun run validate   # themes, token lint, types, unit, build, size budget
```

```
packages/ui/   @codeatlasdev/ui, the published lib
site/          docs, landing and theme editor at ui.codeatlas.com.br (Astro)
docs/adr/      architecture decisions
```

Releases are automated: add a changeset (`bun changeset`) to your PR, and merging the generated Version Packages PR publishes to npm with provenance. Channels `latest`, `beta` and `alpha` map to branches. Full flow in [CONTRIBUTING](https://github.com/codeatlasdev/ui/blob/main/CONTRIBUTING.md#release-flow).

---

<div align="center">

[contributing](https://github.com/codeatlasdev/ui/blob/main/CONTRIBUTING.md) · [code of conduct](https://github.com/codeatlasdev/ui/blob/main/CODE_OF_CONDUCT.md) · [security](https://github.com/codeatlasdev/ui/blob/main/SECURITY.md) · [MIT](https://github.com/codeatlasdev/ui/blob/main/LICENSE)

</div>
