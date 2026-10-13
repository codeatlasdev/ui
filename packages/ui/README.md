<div align="center">

# @codeatlasdev/ui

**full screens for svelte 5, not lego bricks.**<br>
your AI agent already knows how to use it.

[![npm](https://img.shields.io/npm/v/@codeatlasdev/ui?style=flat-square&color=f59e0b)](https://www.npmjs.com/package/@codeatlasdev/ui)
[![license](https://img.shields.io/npm/l/@codeatlasdev/ui?style=flat-square)](https://github.com/codeatlasdev/ui/blob/main/LICENSE)
[![svelte](https://img.shields.io/badge/svelte-5_runes-ff3e00?style=flat-square)](https://svelte.dev)
[![skills](https://img.shields.io/badge/agent_skills-3-8b5cf6?style=flat-square)](https://github.com/codeatlasdev/ui/tree/main/.agents/skills)

[docs + live demo](https://ui.codeatlas.com.br) · [llms.txt](https://github.com/codeatlasdev/ui/blob/main/llms.txt) · [agent guide](https://github.com/codeatlasdev/ui/blob/main/AGENTS.md)

</div>

---

## tl;dr

```svelte
<AppList title="Users" data={users} searchKeys={['name', 'email']}>
  {#snippet children(list)}
    <SimpleTable>
      {#each list.rows as u (u.id)}
        <tr><td><UserCell name={u.name} email={u.email} /></td></tr>
      {/each}
    </SimpleTable>
  {/snippet}
</AppList>
```

That's a whole users page. Search, pagination, empty state, header, glass surface. Zero CSS written.

Most UI kits hand you a button and wish you luck. This one hands you the page.

## 🤖 AI first, for real

The API is designed so an LLM gets it right on the first try. Component name says what the screen is. Props are data. Snippets are the holes you fill. No styling decisions to hallucinate.

Give your agent the context in one line:

```sh
npx skills add codeatlasdev/ui
```

That installs three skills into Claude Code, Cursor, Codex and friends:

| skill | what it teaches |
|---|---|
| `codeatlas-ui` | every component, prop and layout rule in the lib |
| `codeatlas-dx` | file structure and size limits so the codebase stays clean |
| `codeatlas-writing` | UI copy that doesn't read like a chatbot wrote it |

Not using skills? Point the agent at [`llms.txt`](https://github.com/codeatlasdev/ui/blob/main/llms.txt) or [`AGENTS.md`](https://github.com/codeatlasdev/ui/blob/main/AGENTS.md). Same info, plain markdown.

## install

```sh
bun add @codeatlasdev/ui    # or npm i, pnpm add, whatever you're on
```

Three files and you're live.

```ts
// vite.config.ts: anti-flash theme script in dev + SSR deps sorted
import { sveltekit } from '@sveltejs/kit/vite';
import { caThemePlugin } from '@codeatlasdev/ui/vite';
import { defineConfig } from 'vite';

export default defineConfig({ plugins: [sveltekit(), caThemePlugin()] });
```

```ts
// src/hooks.server.ts: same script for SSR and prerendered pages
import { sequence } from '@sveltejs/kit/hooks';
import { caThemeHandle } from '@codeatlasdev/ui/kit';

export const handle = sequence(caThemeHandle());
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

Done. Dark mode works, no white flash on load.

## the vibe

- **no CSS homework.** `Grid`, `Row` and `Stack` take a numeric `gap`. Colors, radius and type live in `--ca-*` tokens.
- **pages, not primitives.** `AppList`, `AppForm`, `AppSettings`, `AppShellLayout`. Layout, spacing and empty states come baked in.
- **liquid glass.** Apple HIG material tiers, real `backdrop-filter`, tuned per theme for light and dark.
- **svelte 5 only.** `$state`, `$derived`, `$props` all the way down. No legacy compat layer.
- **light where it counts.** Charts load ECharts lazily with only the modules they use. Table and code highlighting drop out of your bundle if you don't import them.

## what's in the box

70 components.

| | |
|---|---|
| page templates | `AppList` `AppForm` `AppSettings` `PageShell` |
| nav shell | `AppShellLayout` `Rail` `Panel` `SiteHeader` `BottomNav` `MobileHeader` |
| auth | `AuthLayout` `AuthCard` |
| layout | `Grid` `Row` `Stack` `FormSection` |
| data | `DataTable` `SimpleTable` `Pagination` `KpiCard` `EmptyState` `FilterGroup` |
| charts | `LineChart` `BarChart` `PieChart` `ScatterChart` `HeatmapChart` `GaugeChart` `RadarChart` `Sparkline` |
| forms | `Button` `TextField` `TextArea` `NumberField` `Select` `Combobox` `Checkbox` `RadioGroup` `Switch` `Slider` `FileUpload` |
| display | `Avatar` `Badge` `Chip` `StatusChip` `Alert` `Timeline` `CodeSnippet` `Kbd` `Stepper` |
| navigation | `Breadcrumb` `Tabs` `Accordion` `Collapsible` `NotificationBell` |
| overlays | `Dialog` `Drawer` `Popover` `Tooltip` `DropdownMenu` `CommandPalette` |
| feedback | `Toast` `Spinner` `Skeleton` `Progress` `ErrorPage` |
| surfaces | `GlassCard` `GlassSurface` `GlassAppBar` `LiquidGlass` |

Charts take data, not ECharts configs. Colors and fonts follow the active theme automatically.

```svelte
<LineChart categories={['jan', 'feb', 'mar']} series={[{ name: 'MRR', data: [12, 19, 31] }]} />
```

## themes

Eight OKLCH presets. One attribute flips the whole app.

```html
<html data-preset="violet" class="dark">
<!-- amber · ocean · crimson · cyan · violet · emerald · rose · slate -->
```

Components never know which theme is on. That's the point.

## where it sits

| | @codeatlasdev/ui | shadcn-svelte | Bits UI |
|---|---|---|---|
| what you get | full screens | copy-paste components | headless primitives |
| page templates | ✅ | ❌ | ❌ |
| nav shell | ✅ | ❌ | ❌ |
| CSS you write | basically none | some | all of it |
| theme swap | one attribute | edit CSS vars | bring your own |
| agent skills | ✅ | ❌ | ❌ |

Need pixel-level control over every primitive? Bits UI is great, and we're built on it. Want to ship the dashboard today? You're in the right place.

## hacking on it

```sh
git clone https://github.com/codeatlasdev/ui && cd ui
bun install
bun dev          # builds the lib, then the docs site on :4321
bun run validate # lint + type-check, the PR gate
```

```
packages/ui/   @codeatlasdev/ui, the published lib
site/          the docs + landing at ui.codeatlas.com.br (Astro)
```

Releases are automated: add a changeset (`bun changeset`) to your PR; merging the generated Version Packages PR publishes to npm with provenance. Channels `latest`, `beta` and `alpha` map to branches. Full flow in [CONTRIBUTING](https://github.com/codeatlasdev/ui/blob/main/CONTRIBUTING.md#release-flow).

---

<div align="center">

[contributing](https://github.com/codeatlasdev/ui/blob/main/CONTRIBUTING.md) · [code of conduct](https://github.com/codeatlasdev/ui/blob/main/CODE_OF_CONDUCT.md) · [security](https://github.com/codeatlasdev/ui/blob/main/SECURITY.md) · [MIT](https://github.com/codeatlasdev/ui/blob/main/LICENSE)

</div>
