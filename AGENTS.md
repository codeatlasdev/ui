# AGENTS.md: Guide for AI Agents

This document covers everything an AI agent needs to know to work in this repository.

---

## What this project is

`@codeatlasdev/ui` is CodeAtlas's UI package. It is a Svelte 5 library published publicly on npm. Every company frontend imports components, tokens and styles from here.

---

## Monorepo structure

```
packages/ui/          → publishable library (@codeatlasdev/ui)
  bin/                → CLIs: codeatlas-ui (init, migrate) and ca-ui-mcp (MCP server)
  scripts/            → build-manifest.ts (components/tokens/guides.json), build-bin.ts, build-themes.ts
  src/cli/            → init and migrate logic (tested in tests/cli.test.ts)
  src/lib/
    components/       → Svelte 5 components
    styles/           → CSS: global.css (everything), core.css (no extra presets), presets/*.css, base.css, tokens.css, materials.css
    tokens/           → TypeScript constants (colors, typography, shadows, etc.)
    stores/           → reactive svelte $state (colorScheme, responsive, reducedMotion)
    utils/            → debounce, clipboard, localStorage, palette-generator
    index.ts          → main barrel export
site/                 → Astro site (landing + MDX docs + templates) at ui.codeatlas.com.br
```

---

## Issue workflow (agents and humans)

- **Claim before coding:** `bun run issue:start <n>` creates `../ui-worktrees/<n>-<slug>` on `fix|feat/<n>-<slug>`, opens a draft PR (`Closes #<n>`), labels `in progress`, assigns and comments on the issue. Work only inside that worktree. Parallel agents each take their own issue and worktree; never share a checkout.
- **Check first:** `bun run issue:status`. Skip issues labeled `in progress` by someone else. Re-read the issue against current `main`: if it is already fixed, prove it with a passing test, comment the evidence and close it.
- **Test first** (critical rule 0): failing regression test, then the fix, then the passing run. Both outputs go in the PR body.
- **Done:** `bun run validate`, changeset when the package changes, docs when behavior changes, `gh pr ready`. After merge, `bun run issue:done <n>`.

---

## Tests

Unit tests run on `bun test` (repo root, `bunfig.toml`); component and visual tests need a real Chromium and stay on Vitest. Use `bun run test` (everything) or the scripts below. A bare `bun test` at the root runs only the unit tests.

| Command | What it runs |
|---|---|
| `bun run test` | unit + browser + E2E |
| `bun run test:unit` | `bun test` on `packages/ui/tests/*.test.ts` (fails any test without an `expect`) |
| `bun run test:browser` | Vitest `browser` project (real Chromium, axe) |
| `bun run test:e2e` / `test:a11y` | Playwright against the static site (build + preview) |
| `bun run test:vrt` | visual regression via Docker (Linux-only baselines, compare only) |
| `bun run test:vrt:update` | regenerate baselines on CI (native amd64) for the pushed branch and pull the bot commit; `test:vrt:update:local` does it in Docker (slow on Apple Silicon) |
| `bun run test:status` | live and dead test runs of this repo, with their browser count |
| `bun run test:reap` | kill the browsers of runs whose runner died (this repo only) |

**Never call `vitest` / `playwright test` directly for browser tests: always go through the scripts above.** They run under `scripts/test-run.ts`, which:
- records each run in `.cache/test-runs/<id>.json` and tags every browser it starts with `--ca-test-run=<id>`;
- tears down the whole test process group on exit, Ctrl+C, SIGTERM or SIGHUP;
- at the start of every run, kills browsers left by runs whose runner died (SIGKILL, closed terminal, killed agent job).

Ownership is explicit: only processes carrying the tag of a dead run of this repo are touched. Other projects on the machine (`../ac`, …) share `~/Library/Caches/ms-playwright`; never kill Playwright browsers by name or path. To pass extra args: `bun run test:browser -- src/lib/components/Button`. Local runs use half the cores (`maxWorkers`, Playwright `workers: "50%"`); behavior tests use the headless shell, VRT uses full Chromium so pixels match the Docker baselines.

Naming conventions:
- `*.test.ts` in `packages/ui/tests/`: unit test on `bun:test` (`mock`/`spyOn`/`jest.useFakeTimers`; DOM only through happy-dom's `GlobalRegistrator` inside that file; fresh module via `import("…?fresh=n")`). Types checked by `bun --check`.
- `*.svelte.test.ts`: component in the browser, next to the component.
- `*.vrt.test.ts`: per-component screenshot; matrix harness `NameMatrix.test.svelte`.
- `*.test.svelte`: harness for snippets/`bind:` (not shipped in `dist`).
- `site/tests/*.spec.ts` (desktop+mobile+iphone), `*.a11y.spec.ts`, `*.visual.spec.ts`.
- Keep test titles short: `describe` + `it` combined at most ~80 characters. Vitest names the trace attachment with path + title + hash, and names over 255 bytes fail with `ENAMETOOLONG`, losing the trace exactly when the test fails.

Rule: every new component needs a `.svelte.test.ts` with `expect(await checkA11y(screen.container)).toHaveNoViolations()` in each state (open/closed). `render` from `vitest-browser-svelte` is async. `a11y_*` warnings are errors: `bun run check` uses `--fail-on-warnings` and the site build fails via `onwarn` (`site/svelte.config.js`). (`svelte-package` does not compile `.svelte`, so in the package it is `check` that blocks.)

Accessibility rules (package and apps):
- A page has exactly one `<main>` and one `id="main"`. `DocsShell` and `AuthLayout` already provide them; `AppShellLayout` uses a `div.ca-shell__content` as the `SkipLink` target (pass `mainId={null}` if the page renders its own `<main id="main" tabindex="-1">`, and `skipLink={false}` when embedding the shell in a page that already has a skip link). `PageShell` never emits `<main>`.
- Screen reader announcements go through `announce(msg, politeness)` (one shared live region); do not create a new local `role="status"`. In SvelteKit, mount `RouteAnnouncer` (`@codeatlasdev/ui/kit`) once in the root layout.
- An `aria-label` on a button must contain the visible text (WCAG 2.5.3); compose with `aria-labelledby` as `Combobox` does with `ariaLabel`.
- New surface CSS with glass/shadow/`border: none` needs an entry in the `@media (forced-colors: active)` block of `materials.css` (`CanvasText` border). Contrast tokens (`prefers-contrast: more`) come from `themeCSS`/`presetCSS`; `tests/contrast.test.ts` measures 7:1 for text and 3:1 for outlines in every preset.
- `site/tests/routes.a11y.spec.ts` runs axe in dark, light and `forcedColors: "active"` on every route, and ensures at most one `#main`, one `<main>` and one skip link per page.

Reading failures: locators fail with an ARIA snapshot; traces are in `__traces__/` (Vitest) and `site/test-results/<id>/trace.zip` (`bunx playwright trace open <zip>`); visual diffs are in `packages/ui/.vitest/attachments` and `site/playwright-report`. For lean output: `bunx vitest run --reporter=minimal`. Optional: `npx @playwright/mcp` to inspect the site.

---

## Critical rules

0. **Test first, always.** Every bug fix and issue starts with a regression test that reproduces the problem. Run it and confirm it fails on the current code, then fix, then confirm it passes. A PR reports that fail-before/pass-after evidence. Tests exist to prove a behavior or a fix, never to pad coverage: no tests of wiring, copies, mock echoes or incidental defaults. If a test cannot fail for a plausible bug, delete it.

1. **Required setup**: consumers import the CSS once (it already includes `materials.css`, themes and utilities), register both Vite plugins (`caThemePlugin`: anti-FOUC script + `ssr.noExternal` for TanStack Table and Shiki; `caErrorPlugin`: scaffolds `+error.svelte`/`error.html`) and export `handle` + `handleError` from the server hook. Plugin order in `plugins` does not matter (built with every order on Kit 3.0.1 / Vite 8.3); `init` writes them after `sveltekit()`:
   ```ts
   import "@codeatlasdev/ui/styles/global.css";
   ```
   ```ts
   // vite.config.ts
   import { caErrorPlugin, caThemePlugin } from "@codeatlasdev/ui/vite";
   import { theme } from "./src/lib/theme.ts";
   export default defineConfig({
     plugins: [sveltekit(), caThemePlugin(theme), caErrorPlugin({ scaffold: true })],
   });
   ```
   ```ts
   // src/hooks.server.ts: injects the theme script into SSR/prerendered pages, sanitizes server errors
   import { sequence } from "@sveltejs/kit/hooks";
   import { caThemeHandle, createErrorHandler } from "@codeatlasdev/ui/kit";
   import { theme } from "$lib/theme"; // Kit 3: "#lib/theme.ts"
   export const handle = sequence(caThemeHandle(theme));
   export const handleError = createErrorHandler();
   ```
   SvelteKit 3 (`@sveltejs/kit ^3`): config goes into `sveltekit({ adapter, ... })` (no `svelte.config.js`, no `kit` namespace), `tsconfig.json` extends `$app/tsconfig`, `$lib` is removed in favor of `#lib/*` (with the `.ts` extension), and `vite.config.ts` imports the theme with its `.ts` extension. `bunx @codeatlasdev/ui init` detects the Kit version. Details: the SvelteKit 3 section of `.agents/skills/codeatlas-ui/SKILL.md`.

2. **`backdrop-filter` + `will-change: transform`**: never combine the two on the same element or an ancestor. It kills the glass blur.

3. **`isolation: isolate`**: `backdrop-filter` inside an `isolation: isolate` parent captures the isolated context, not the real backdrop.

4. **Svelte 5 runes**: all code uses runes (`$state`, `$derived`, `$effect`, `$props`). Never use legacy `writable`/`readable`.

5. **`{@const}`**: valid only as an immediate child of `{#each}`, `{#if}`, `{#snippet}`, `{:else}`, or `Component`. Never inside `<div>` or another element.

6. **`svelte:component`**: deprecated in runes mode. Use `{@const Icon = X}<Icon />` or `<X />` directly.

7. **Sub-components**: `DropdownMenuItem` etc. are separate `.svelte` files exported by name; there are no dotted namespaces.

8. **OKLCH**: the whole color palette uses OKLCH. MUI does not accept OKLCH directly; if you integrate with MUI, convert to hex.

9. **No inline CSS**: never `style="padding: 20px"` or `style="max-width: 480px"`. Use CSS classes with tokens (`var(--ca-space-5)`). The only exception is dynamic CSS custom properties: `style="--bar-w:{pct}%"`.

10. **No `Stack`/`Row` for field layout inside `FormSection`**: `FormSection` already has `layout="grid"` (default), `layout="list"` and `layout="stack"`. Do not wrap fields in `Stack gap={N}` as a layout workaround.

11. **`ca-*` classes are a public contract**: consuming apps use the BEM classes (`.ca-btn`, `.ca-dialog__body`, …) as CSS targets. Renaming or removing a `ca-*` class listed in [`docs/css-api.md`](docs/css-api.md) is a **breaking change**. When you create or rename a component, update that file.

12. **Mobile**: heights use `var(--ca-vh)` (never `100vh`/`100dvh`); `fixed` UI uses `var(--ca-safe-*)`; a form with a keyboard uses `use:keyboardAware` (`@codeatlasdev/ui/actions`); a full-screen mobile view is `MobilePane`, an action bar is `StickyActions`; the 44px touch target is global under `(pointer: coarse)`, so do not write an override in the app. App viewport: `width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content`.

13. **Theme**: a single `ThemeOptions` in `src/lib/theme.ts` (plain object, `import type` only: `vite.config`/`astro.config` load the file in Node, where the package root does not evaluate `.svelte`), passed to `caThemeHandle` + `caThemePlugin` (SvelteKit) or `caUI` (Astro). Override a token by declaring `--ca-*` on `:root` in the app, without `!important`. Local islands: `data-theme-scope="dark|light"`. Automatic setup: `bunx @codeatlasdev/ui init`.

14. **SEO**: a public page uses `<Seo>` from `@codeatlasdev/ui/seo` with a required `canonical`; a private page passes `noindex`.

15. **Discovering the API**: never guess a prop. Use the `ca-ui-mcp` MCP server (`get_component`, `list_components`, `search_tokens`, `get_guide`) or `.agents/skills/codeatlas-ui/API.md`; both are generated from the code by `packages/ui/scripts/build-manifest.ts` (runs on `build`). `[ca-ui]` dev warnings (via `devWarn`, `esm-env`) flag an `IconButton` without `aria-label` and a `Dialog` without `title`.

16. **Agent skills layout** (`npx skills add codeatlasdev/ui`): one folder per skill under `.agents/skills/`, named exactly like the `name:` in its `SKILL.md` (`codeatlas-ui`, `codeatlas-dx`, `codeatlas-writing`). Never put a `SKILL.md` directly in `.agents/skills/` (the CLI then treats the directory as a single skill and lists nothing else), and quote any `description:` that contains `: ` (an unquoted one is a YAML error and the CLI silently skips the skill). `packages/ui/tests/skills.test.ts` enforces this.

---

## Spacing system (global tokens)

**Every component uses CSS variables, never hardcoded px values.**

```css
/* Spacing scale: base 4px */
--ca-space-1:  4px
--ca-space-2:  8px
--ca-space-3:  12px
--ca-space-4:  16px
--ca-space-5:  20px
--ca-space-6:  24px
--ca-space-7:  28px
--ca-space-8:  32px
--ca-space-10: 40px
--ca-space-12: 48px
--ca-space-16: 64px

/* Page layout: consistent padding across ALL page layouts */
--ca-page-px:    24px   /* default horizontal padding */
--ca-page-px-sm: 16px   /* mobile horizontal padding */
--ca-page-pt:    20px   /* default top padding */
--ca-page-pt-sm: 14px   /* mobile top padding */
--ca-page-gap:   20px   /* gap between sections */
```

---

## Utility classes (`global.css` → available in every app)

Imported automatically via `global.css`. No extra configuration needed.

| Class | Use |
|---|---|
| `ca-search-field` | Toolbar search field: `flex:1`, `min-width:180px`, `max-width:320px` |
| `ca-toolbar-spacer` | `flex:1`: pushes items to the right side of the toolbar |
| `ca-page-info` | "1–8 of 240" text in the pagination footer |
| `ca-row-actions` | Row actions: hidden by default, visible on hover |
| `ca-btn-danger` | Red outlined button |
| `ca-btn-danger-ghost` | Red ghost/text button |
| `ca-bar-fill` | Dynamic progress bar: uses the `--bar-w` CSS var |
| `ca-bar-fill--warn` | Warning variant of the bar |
| `ca-pricing-cta` | CTA button at the bottom of a pricing card (`width:100%; margin-top:auto`) |
| `ca-sr-only` | Visually hidden, still in the a11y tree (table `<caption>`, unlabeled control, extra AT-only text). Never `display:none`/`aria-hidden` for this |
| `ca-sr-only ca-sr-only--focusable` | Same, but shown again while it or a descendant has focus (skip links) |

---

This is the most important rule for staying consistent across the site and real apps.

### `AppList`: fullscreen list/CRUD

**When to use:** an entity list page (users, orders, invoices, etc.)

Behavior: the page does NOT scroll. Only the table scrolls. Header, toolbar and pagination footer stay fixed.

```svelte
<AppList title="Users" data={users} searchKeys={['name', 'email']} perPage={8}>
  {#snippet actions()}
    <Button variant="filled" href="/users/new">+ New user</Button>
  {/snippet}

  {#snippet filters(list)}
    <FilterGroup options={roleOpts} value={list.filters['role']}
                 onchange={(v) => list.setFilter('role', v)} />
  {/snippet}

  {#snippet children(list)}
    <SimpleTable>
      <thead><tr><th>Name</th><th>Role</th><th>Status</th></tr></thead>
      <tbody>
        {#each list.rows as u (u.id)}
          <tr>
            <td class="primary"><UserCell name={u.name} email={u.email} /></td>
            <td>{u.role}</td>
            <td><StatusChip status={u.status === 'active' ? 'success' : 'neutral'} /></td>
          </tr>
        {/each}
      </tbody>
    </SimpleTable>
  {/snippet}
</AppList>
```

With `data`, `AppList` renders search, count, pagination and empty state on its own. Use manual `toolbar`/`footer` only when pagination happens on the server.

---

### `AppForm`: create/edit form

**When to use:** a page to create or edit an entity (New User, Edit Post, etc.)

Behavior: header and footer stay fixed. Only the form body scrolls.

```svelte
<AppForm title="New User" description="Fill in the details to create a new user.">
  {#snippet leading()}
    <!-- back button goes here -->
    <Button variant="ghost" size="sm" href="/users">
      {#snippet leading()}<ArrowLeft size={15} />{/snippet}
    </Button>
  {/snippet}

  <!-- FormSection layout="grid" is the default: text fields sit in 2 columns -->
  <FormSection title="Account details" description="Basic information.">
    <TextField label="Full name" bind:value={name} />
    <TextField label="Email" type="email" bind:value={email} />
    <Select label="Role" bind:value={role} options={roleOpts} />
  </FormSection>

  <!-- layout="list" for Switch, SettingItem, Divider -->
  <FormSection title="Notifications" layout="list">
    <Switch label="Send welcome email" bind:checked={notify} />
  </FormSection>

  {#snippet footer()}
    <Button variant="ghost" href="/users">Cancel</Button>
    <Button variant="filled" onclick={save} disabled={saving || !name || !email}>
      {saving ? 'Saving…' : 'Create user'}
    </Button>
  {/snippet}
</AppForm>
```

**`AppForm` rules:**
- The back button goes in `{#snippet leading()}`, not as the first child of the form
- Cancel/save actions go in `{#snippet footer()}`, never in the body
- Do not pass `maxWidth`: the content takes all available space
- `FormSection` default `layout="grid"` works for text fields
- `FormSection layout="list"` for Switch/SettingItem (no gap, flush)
- `FormSection layout="stack"` for composite blocks (Avatar + fields)

---

### `AppSettings`: settings with side navigation

**When to use:** a settings page with multiple sections (Workspace, Notifications, Security, etc.)

Behavior: fixed side nav on the left. The right content scrolls.

```svelte
<script lang="ts">
  import { AppSettings, FormSection, SettingItem, Switch, Button, Divider } from '@codeatlasdev/ui';
  import { Settings, Bell, Shield } from '@lucide/svelte';

  const TABS = [
    { value: 'general',  label: 'General',       icon: Settings },
    { value: 'notifs',   label: 'Notifications',  icon: Bell     },
    { value: 'security', label: 'Security',       icon: Shield   },
  ];

  let tab    = $state('general');
  let saving = $state(false);

  function save() { saving = true; setTimeout(() => (saving = false), 900); }
</script>

<AppSettings
  title="Settings"
  description="Manage your workspace."
  tabs={TABS}
  activeTab={tab}
  onTabChange={(t) => (tab = t)}
>
  {#snippet actions()}
    <Button variant="filled" size="sm" onclick={save} disabled={saving}>
      {saving ? 'Saving…' : 'Save changes'}
    </Button>
  {/snippet}

  {#if tab === 'general'}
    <FormSection title="Workspace">
      <TextField label="Name" bind:value={workspaceName} />
      <Select label="Timezone" bind:value={timezone} options={tzOpts} />
    </FormSection>
  {/if}

  {#if tab === 'notifs'}
    <FormSection title="Email" layout="list">
      <SettingItem label="New signups" description="Email on every new user.">
        <Switch bind:checked={emailSignup} />
      </SettingItem>
      <Divider />
      <SettingItem label="System errors" description="Critical alerts.">
        <Switch bind:checked={emailErrors} />
      </SettingItem>
    </FormSection>
  {/if}
</AppSettings>
```

**`AppSettings` rules:**
- Do not pass `maxWidth`: the content takes the whole available area
- Each tab renders with `{#if tab === 'x'}` in the body
- `FormSection layout="list"` for `SettingItem` + `Switch` (the most common pattern in settings)
- `FormSection layout="grid"` for text fields (name, email, etc.)
- Global actions (Save/Cancel) go in `{#snippet actions()}`

---

### `MobilePane` and `StickyActions`: native-feeling mobile

```svelte
<MobilePane bind:open={chatOpen} title="Maria" onback={() => (chatId = null)}>
  {#snippet actions()}<IconButton aria-label="More">…</IconButton>{/snippet}
  <Messages />
</MobilePane>

<StickyActions align="stretch" show={dirty}>
  <Button variant="ghost">Cancel</Button>
  <Button variant="filled">Save</Button>
</StickyActions>
```

`MobilePane`: `bind:open`, `title`, `onback?`, `actions?`, `headerTitle?` (replaces the title text), `scroll=true` (`false` when the body has its own scroll and composer). Never hand-roll `position: fixed` for full-screen mobile views. `AuthLayout` shows a brand strip below 768px (`mobileBrand`, default `true`); do not create a local `AuthBrand`.

---

### `PageShell`: dashboards and free-form content pages

**When to use:** dashboards, reports, analytics. Any page that is not a list, form or settings page.

```svelte
<PageShell title="Dashboard" description="Monday, Sep 22, 2026" maxWidth="1200px" gap={24}>
  {#snippet actions()}
    <Button variant="ghost" size="sm">Export</Button>
  {/snippet}

  <Grid cols="repeat(auto-fill, minmax(200px, 1fr))" gap={16}>
    <KpiCard title="Revenue" value="$112k" trend={18.4} icon={DollarSign} />
    <KpiCard title="Users"   value="24.8k" trend={12.1} icon={Users}      />
  </Grid>

  <GlassCard title="Revenue vs Expenses">
    <LineChart series={[...]} categories={months} area height="260px" />
  </GlassCard>
</PageShell>
```

---

## `FormSection`: quick reference

| `layout` | Use when | Behavior |
|---|---|---|
| `"grid"` (default) | `TextField`, `Select`, `NumberField` | Auto-fill 2 columns, `minmax(260px, 1fr)` |
| `"list"` | `Switch`, `SettingItem`, `Divider` | Single column, no gap between items |
| `"stack"` | Composite blocks (Avatar + fields, groups) | Single column, `gap: 16px` |

**Never** wrap fields in `<Stack gap={N}>` inside `FormSection`. Let `layout` do the work.

---

## Available components

### Page layout (App-level)
| Component | Use |
|---|---|
| `AppList` | Fullscreen list: table with internal scroll, fixed pagination |
| `AppForm` | Form: header + scrolling body + sticky footer |
| `AppSettings` | Settings: side nav + scrollable content |
| `PageShell` | Dashboard/content: normal scroll, max-width, configurable gap |
| `MobilePane` | Full screen above the shell on mobile (chat thread, history, detail): header with back, Escape closes, focus enters/returns, safe-area and virtual keyboard |
| `StickyActions` | Form action bar stuck to the end of the scroll (`align="end" \| "stretch"`, `show`): glass, safe-area and virtual keyboard |

### Content layout
| Component | Use |
|---|---|
| `FormSection` | Form section: title, description, grid/list/stack of fields |
| `SettingItem` | Settings row: label + description + control (Switch, Button) |
| `GlassCard` | Generic glass container |
| `KpiCard` | Metric card: value, trend, icon |
| `Grid` | CSS grid with configurable `cols` and `gap` |
| `Row` | Flex row with `gap`, `align`, `justify` |
| `Stack` | Flex column with `gap` |
| `EmptyState` | Empty state with icon, title, action |

### AppShell (app shell)
| Component | Description |
|---|---|
| `AppShellLayout` | Root layout: Rail + Panel + content |
| `Rail` | 52px side dock. Logo via `{#snippet brand()}`, actions via `{#snippet railBottom()}` |
| `Panel` | 200px navigation panel with spring animation |
| `BottomNav` | Bottom navigation for mobile |
| `MobileHeader` | Mobile header |

### Glass surfaces
| Component | Use |
|---|---|
| `GlassSurface` | Generic glass container with configurable material and thickness |
| `GlassCard` | Glass card with default padding, optional title, `flush`, `full` |
| `LiquidGlass` | Liquid Glass effect with background distortion |

### DataTable (TanStack Table v9)
```ts
import { DataTable, createCaTable, createCaColumnHelper, caTableFeatures } from "@codeatlasdev/ui/table";
```
- Server-side: `createCaTable` + `caTableFeatures` for server-side sorting/filtering/pagination
- `CaColumnDef<T>`: column type with metadata (`meta.label`, `meta.filterVariant`)
- For simple lists use `SimpleTable` + `UserCell` + `StatusChip`, which is lighter

### Display
`Avatar` · `Image` · `Badge` · `Alert` · `Chip` · `StatusChip` · `KpiCard` · `EmptyState` · `Timeline` · `Sparkline` · `SimpleTable`

- **`SimpleTable` `responsive`**: `"scroll"` (default) or `"cards"`. With `cards`, below `md` each `<tr>` becomes a card and each `<td>` shows its label via `::before { content: attr(data-label) }`. **Required: pass `data-label="Column"` on every `<td>`** (a cell without `data-label` has no label). No local scroll wrappers needed.
  ```svelte
  <SimpleTable responsive="cards">
    <thead><tr><th>Name</th><th>Status</th></tr></thead>
    <tbody>{#each rows as r}<tr><td data-label="Name">{r.name}</td><td data-label="Status">{r.status}</td></tr>{/each}</tbody>
  </SimpleTable>
  ```
- **Touch target**: `--ca-touch-target: 44px` (`tokens.css`). Under `@media (pointer: coarse)` it becomes `min-height`/`min-width` of `IconButton`, the `Select` trigger, `TabsTrigger`, `ToggleGroup`, `SegmentedControl`, `PinInput` and calendar cells. It is a media query, not a prop: do not write 44px overrides in the app.

### Inputs (own primitives with glass tokens)
`Button` · `IconButton` · `TextField` · `TextArea` · `Select` · `Combobox` · `Checkbox` · `Switch` · `Slider` · `NumberField` · `FileUpload` · `ToggleGroup` · `SegmentedControl` · `PinInput` · `CopyButton` · `DatePicker` · `DateRangePicker` · `DateField` · `TimeField` · `Calendar` · `RangeCalendar`

- **`Button` / `IconButton` `loading`**: swaps `leading` (Button) or the icon (IconButton) for a `Spinner`, applies `aria-busy="true"`, disables the click (`onclick` does not fire) and keeps the label. Class: `ca-btn--loading`.
- **`ToggleGroup`**: `type="single" | "multiple"`, `bind:value` (`string` or `string[]`), `items: { value, label?, icon?, disabled?, 'aria-label'? }[]` (an icon-only item requires `aria-label`), `size="sm" | "md"`, `variant="outlined" | "ghost"`, `orientation`, `onchange`.
- **`SegmentedControl`**: single `ToggleGroup` with a sliding pill (`.ca-seg__thumb`, no animation under `reducedMotion`). Props: `bind:value`, `items`, `size="sm" | "md"`, `fullWidth`, `disabled`, `onchange`.
- **`PinInput`**: OTP. `length=6`, `bind:value`, `type="numeric" | "text"`, `label`, `description`, `error`, `mask`, `oncomplete(value)`.
- **`CopyButton`**: `value`, `label="Copy"` (`''` = icon only), `size`, `variant="ghost"`, `toast?: string` (success message), `oncopy`. The icon becomes `Check` for 2s.
- **Dates** (`DateValue` values from `@internationalized/date`, re-exported by the root: `CalendarDate`, `Time`, `today`, `parseDate`…): `locale="pt-BR"`, `weekStartsOn=1`, `minValue`, `maxValue`, `label`, `description`, `error`, `disabled`, `required`, `bind:value`.
  - `DatePicker`: field + popover with a calendar (`bind:open`, `granularity`, `numberOfMonths`, `closeOnDateSelect`, `name`, `triggerLabel`)
  - `DateRangePicker`: `value: DateRange` (`{ start, end }`), `closeOnRangeSelect`
  - `DateField`: only the typeable segments, no popover
  - `TimeField`: `value: Time`, `granularity="hour" | "minute" | "second"`, `hourCycle`
  - `Calendar` / `RangeCalendar`: inline grid (`fixedWeeks`, `isDateDisabled`, `isDateUnavailable`)

```svelte
<Button loading={saving} onclick={save}>Save</Button>
<SegmentedControl bind:value={view} items={[{ value: "list", label: "List" }, { value: "grid", label: "Grid" }]} />
<DatePicker label="Delivery" bind:value={date} minValue={today(getLocalTimeZone())} />
<TimeField label="Time" bind:value={time} />
<PinInput length={6} oncomplete={verify} />
```

### Overlays
`Dialog` · `AlertDialog` · `Drawer` · `DropdownMenu` · `Popover` · `Tooltip` · `CommandPalette` · `NotificationBell`

- **`AlertDialog`**: confirmation that requires an answer (`role="alertdialog"`, no "X", clicking outside does not close). Props: `bind:open`, `title`, `description?`, `confirmLabel="Confirm"`, `cancelLabel="Cancel"`, `destructive?`, `pending?`, `onconfirm: () => void | Promise<void>`, `oncancel?`. With an async `onconfirm`: confirming shows a spinner, Cancel is disabled, and it closes on resolve (stays open if it throws). Replaces native `confirm()`.
- **`Sheet`**: bottom sheet below 768px, centered dialog above. `swipeToDismiss = true` (bottom layout only): drag the handle or the header (`.ca-sheet__grab`, `touch-action: none`, pointer capture) downward; it closes past 30% of the height or a velocity above 0.5 px/ms, otherwise it springs back with `Spring`. Disabled under `reducedMotion`. The panel moves via `translate` (no `transform`, no backdrop-filter on the panel). The overlay and scrollable bodies of Sheet/Drawer/Dialog use `touch-action: none` / `overscroll-behavior: contain`; the primitives' scroll lock (`primitives/scroll-lock.ts`) is enough on WebKit.
- **`Dialog`**: `size="sm" | "md" | "lg" | "xl" | "split"`. `split` = 1100×720, 2-column grid at ≥`md`, 1 column below. `chromeless` omits header/description/actions and zeroes the body padding (pass `title` for the accessible name; it stays visually hidden).
```svelte
<AlertDialog bind:open title="Delete lead?" description="This cannot be undone." confirmLabel="Delete" destructive onconfirm={() => api.remove(id)} />
<Dialog bind:open size="split" chromeless title="Lead">…</Dialog>
```

### Navigation
`Tabs` · `TabsList` · `TabsTrigger` · `TabsContent` · `Breadcrumb` · `Pagination` · `Stepper`

### Docs (documentation sites)
`DocsShell` (header + sidebar + page index; on mobile a compact header and menu in a `Sheet`) · `DocsNav` · `TableOfContents` (`variant="rail" | "inline"`) · `DocsSearch` + `searchDocs` · `CodeTabs`/`CodeTab` (copy, `sync` across groups) · `Callout` · `Steps` · `LinkCard` · `CardGrid` · `MethodBadge`. Markdown typography: wrap the HTML in `<div class="ca-prose">`; tables in `.ca-table-wrap`, code in `.ca-code` (shiki dual theme). Syntax highlighting is up to the consumer (shiki at build).

```svelte
<DocsShell {sections} active="api" {groups} {pathname} {headings}
  searchIndex={() => fetch('/search.json').then((r) => r.json())} onnavigate={goto}>
  {#snippet brand()}<Logo /> Docs{/snippet}
  <article class="ca-prose">…</article>
</DocsShell>
```

### Feedback
`Spinner` · `Skeleton` · `Progress` · `Toast` · `Toaster`

### Charts (ECharts): `@codeatlasdev/ui/charts`, requires `echarts` installed
`LineChart` · `BarChart` · `PieChart` · `ScatterChart` · `HeatmapChart` · `GaugeChart` · `RadarChart` · `Sparkline`

### Subpaths with an optional peer
Charts, DataTable and CodeSnippet are NOT in the root import. Each subpath requires its peer:

| import | peer |
|---|---|
| `@codeatlasdev/ui/charts` | `echarts` |
| `@codeatlasdev/ui/table` | `@tanstack/svelte-table` |
| `@codeatlasdev/ui/code` | `shiki` |
| `@codeatlasdev/ui/forms` | none (Brazilian masks, `MoneyInput`, ready-made fields) |

### `@codeatlasdev/ui/forms`: Brazilian fields
```ts
import { MaskedField, MoneyInput, PhoneField, CepField, mask,
  maskCPF, maskCNPJ, maskCPFCNPJ, maskCEP, maskPhoneBR, maskDateBR, maskRG,
  isValidCPF, isValidCNPJ, isValidDateBR, centsToDisplay, parseInputToCents } from "@codeatlasdev/ui/forms";
```
| Symbol | Use |
|---|---|
| `MaskedField` | `TextField` + `mask: (raw) => string` + `validate?: (v) => string \| undefined` (runs on blur). Automatic `inputmode` (`numeric` for CPF/CEP/phone/date) |
| `MoneyInput` | `value` in **cents** (integer, bindable). `123456` displays `R$ 1.234,56`. Props: `min`, `max`, `allowNegative` (default `false`), `onchange(cents)` |
| `PhoneField` | bindable `value` in **E.164** (`+5511987654321`; `''` if incomplete). `country="BR"` |
| `CepField` | masked `bind:value` + `onlookup?: (cep) => Promise<CepAddress \| null>` (the package does no fetching: inject ViaCEP), `onresolve(address)`, `bind:lookupPending` to disable dependent fields |
| `maskCPF` `maskCNPJ` `maskCPFCNPJ` `maskCEP` `maskPhoneBR` `maskDateBR` `maskRG` | Pure functions `(raw: string) => string` |
| `isValidCPF` `isValidCNPJ` `isValidDateBR` | Validation (check digits / real date) |
| `centsToDisplay(cents)` · `parseInputToCents(text)` | `123456` ⇄ `"R$ 1.234,56"` |
| `use:mask={maskCPF}` | Action for a native `<input>`; preserves the cursor (counts digits before the caret) |

```svelte
<MaskedField label="CPF" mask={maskCPF} validate={(v) => (isValidCPF(v) ? undefined : "Invalid CPF")} bind:value={cpf} />
<MoneyInput label="Amount" bind:value={cents} min={0} />
<PhoneField label="WhatsApp" bind:value={e164} />
<CepField label="CEP" bind:value={cep} bind:lookupPending onlookup={viaCep} onresolve={(a) => (street = a.logradouro)} />
```

`useForm` (root) accepts `arrays` for repeatable rows. Each array is a `FieldArrayState<T>` with `items`, `add(item)`, `remove(index)` and `move(from, to)`:
```ts
const form = useForm({ name: "" }, { arrays: { phones: [{ number: "" }] } });
form.arrays.phones.add({ number: "" });
form.arrays.phones.move(0, 1);
```

---

## TypeScript tokens

```ts
import {
  caColors,      // full OKLCH palette per preset
  caTypography,  // type scale (h1..h6, body1, body2, caption, label, button)
  caShape,       // border radii (xs, sm, md, lg, xl, pill)
  caTransitions, // easing and duration (fast, base, slow, spring)
  caZIndex,      // z-index scale (nav, dropdown, sticky, fixed, drawer, modal, snackbar, tooltip)
  caShadows,     // shadows
  caMaterials,   // material tokens (regular, thick, thin, ultrathin, ultrachick)
} from "@codeatlasdev/ui";
```

---

## CSS tokens (CSS variables)

```
/* Typography */
--ca-font-size-h1..h6 / body1 / body2 / caption / label / button

/* Radius */
--ca-radius-xs / sm / md / lg / xl / pill

/* Z-index */
--ca-z-nav / dropdown / sticky / fixed / drawer / modal / snackbar / tooltip

/* Animation */
--ca-ease-standard / decelerate / accelerate / spring
--ca-duration-fast / base / slow

/* Glass */
--ca-glass-bg / --ca-glass-separator / --ca-glass-tint-* / --ca-glass-border
--ca-blur-ultra-thin / thin / regular / thick / chrome

/* Semantic colors */
--ca-brand-main / --ca-brand-light / --ca-brand-dark / --ca-brand-contrast / --ca-brand-h
--ca-semantic-success / warning / error / info
--ca-text-primary / secondary / disabled   (disabled = label of disabled controls only, >= 3:1; de-emphasised information uses --ca-text-hint)
--ca-surface-base / raised / sunken / overlay
--ca-outline-subtle / default / strong / control   (control = field and control edge, >= 3:1; subtle = dividers only)
--ca-focus-ring / --ca-state-indicator   (>= 3:1 on every surface and on hover/selected fills; components read these, never --ca-brand-main)
--ca-semantic-error-fill / --ca-semantic-error-contrast   (pair, like brand-fill / brand-contrast)
--ca-action-hover / selected / disabled / disabled-bg   (disabled controls use tokens, never opacity)
--ca-overlay-bg / --ca-panel-bg   (near-opaque by default; --ca-overlay-bg-glass / --ca-panel-bg-glass are the see-through tints)

/* Spacing (base 4px) */
--ca-space-1 (4px) .. --ca-space-16 (64px)

/* Page layout */
--ca-page-px    (24px)  ← horizontal padding on every page
--ca-page-px-sm (16px)  ← mobile
--ca-page-pt    (20px)  ← top padding
--ca-page-gap   (20px)  ← gap between sections
```

---

## Themes

```html
<html data-preset="ocean">
<!-- ocean | amber | crimson | cyan | violet | emerald | rose | slate -->
<html class="dark">
```

### Brand theme

Does the product have its own color? Generate a preset from the logo hex. The library derives hue, chroma and lightness (OKLCH) and emits the full token set, light and dark, inline in the `<head>`. No flash.

```ts
// src/lib/theme.ts: one place, used by the hook and the plugin
import type { ThemeOptions } from "@codeatlasdev/ui"; // = Partial<ThemeDefinition>

export const theme: ThemeOptions = {
  presets: [{ id: "acme", color: "#2563eb" }],
  defaultPreset: "acme",   // used until the user picks another
  defaultScheme: "system", // "light" | "dark" | "system"
  defaultStyle: "glass",   // "glass" | "frosted" | "solid" | "flat"
  fonts: { body: "Geist, system-ui, sans-serif" },
  radius: 1,               // multiplier of the radius scale
  density: "comfortable",  // or "compact"
  overrides: { light: { "--ca-card-padding": "16px" } },
};

// src/hooks.server.ts
export const handle = sequence(caThemeHandle(theme));

// vite.config.ts
plugins: [sveltekit(), caThemePlugin(theme)]
```

- `id` must not collide with a built-in preset; `defaultPreset` must exist (build error).
- The init script discards saved values the app does not know (old preset, invalid scheme/style) and falls back to the default.
- Sets `<meta name="theme-color">` to the preset surface and follows the OS in `system` before JS loads.
- Charts use the brand hex as the first series.
- `colorScheme` inherits the defaults: `colorScheme.preset` starts at `"acme"`.

### Cascade and overriding tokens

`core.css` declares `@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components`. **Every component `<style>` block (and `Dialog/dialog.css`, `Date/date.css`) is wrapped in `@layer ca.components { ... }`**, the last kit layer; app CSS is unlayered. Unlayered beats any layer regardless of specificity or source order, so an app overrides a kit rule with the same single-class selector (`.ca-btn:disabled`, `.ca-tf__wrap`, `.ca-dialog__body`), no `!important`, no doubled classes. To override package tokens, declare `--ca-*` on `:root`.

Rules when editing components: (1) new component CSS goes inside `@layer ca.components { ... }` and the `<style>` starts with the full order statement (`@layer ca.reset, ..., ca.components;`), because the first mention of a layer name fixes its priority and a bundler can emit a component chunk before `core.css`; `tests/component-layer.test.ts` fails otherwise. (2) Inside the layer, `:global(...)` and scoped selectors both work (Svelte keeps the hash class; app rules still win by layer). (3) Avoid `!important` in component CSS: a layered `!important` beats unlayered app CSS (the reverse of normal declarations), so apps could not override it. Same-layer conflicts (error vs focus) are settled by selector order/specificity. Allowed only to beat an inline `style=` the component itself sets (Progress indeterminate width, `.ca-main` spring margin, Shiki inline background) and for `prefers-reduced-motion`; `base.css` focus rules use it on purpose. (4) Unlayered kit CSS is not allowed except `marks.css` and inline brand `<style id="ca-theme">`, which are intentionally app-level.

`global.css` = `core.css` (includes only the `amber` preset) + the other 7 presets. Apps that use a single preset import only `styles/core.css` + `styles/presets/<id>.css` (see `site/.../getting-started/performance.mdx`).

The built-in presets are generated: edit `packages/ui/src/lib/theme/builtins.ts` and run `bun run --cwd packages/ui themes` (`validate` fails if `styles/presets/*.css` is out of date).

### Theme islands

```svelte
<section data-theme-scope="dark">…dark mode tokens in here, on any page…</section>
```

### Runtime tokens

`colorScheme.setTokens({ "--ca-brand-main": "#ff5500" })` writes a single `<style id="ca-runtime-tokens">`, persists it, and the init script reapplies it before the first paint. `setTokens({})` clears it.

---

## Stores

```ts
import { colorScheme, reducedMotion, responsive } from "@codeatlasdev/ui";

colorScheme.init()          // in the root layout (onMount); returns cleanup
colorScheme.toggle()        // switch dark/light
colorScheme.setPreset(id)   // change the color preset (colorScheme.presets lists the valid ones)
colorScheme.isDark          // reactive boolean

responsive.init()           // measures and starts following resize; returns cleanup
responsive.current          // 'xs' | 'sm' | 'md' | 'lg' | 'xl'; before init it is desktop
```

---

## Language (i18n)

Every piece of visible text the package generates (aria-label, placeholder, empty states, toasts, "Copy", "On this page"…) comes from a catalog. The default is **English**. `Locale` is any BCP 47 string; `en` and `pt-BR` are built in, others are added with `registerLocale`.

```svelte
<!-- SSR apps: src/routes/+layout.svelte. Request-scoped, never shared between requests. -->
<script>
  import { I18nProvider } from "@codeatlasdev/ui";
  let { data, children } = $props();
</script>
<I18nProvider locale={data.locale}>{@render children()}</I18nProvider>
```

```ts
// Client-only apps (SPA, Astro islands): one module-level locale.
import { registerLocale, setLocale } from "@codeatlasdev/ui";
registerLocale("es", { common: { close: "Cerrar" } }); // partial; missing keys fall back to en
setLocale("es");
```

- **Never call `setLocale` on the server**: it is a no-op there (dev warning), because module state would leak between concurrent requests. Use `I18nProvider`. A provider always wins over `setLocale`.
- `createErrorHandler({ locale })` takes the fallback-message language explicitly (string or `(event) => locale`); it reads no global state.
- The client `$state` behind `setLocale` is module-level: all islands on the same page share the language and re-render on change. `locale.value` reads it; inside a provider use `useLocale()`.
- **An explicit prop always wins** over the catalog: `<TableOfContents label="In this article" />`. Text props (`label`, `placeholder`, `confirmLabel`, `emptyText`, `ofLabel`…) no longer have a default; without the prop, the component uses the catalog.
- **Override phrases** without creating a locale: `<I18nProvider locale="pt-BR" messages={{ docs: { toc: "In this article" } }}>` or `setLocale("pt-BR", { … })`. Deep-merged over the catalog; a new `setLocale` call replaces the previous overrides.
- Catalog: `packages/ui/src/lib/i18n/en.ts` (source of truth, grouped by component, e.g. `docs.search.placeholder`) and `pt-BR.ts` (typed as `Messages`: a missing key is a type error). Strings with a value are functions: `notificationBell.label(unread)`. Registry and `getMessages(locale, override?)` live in the rune-free `catalog.ts`.
- New text in a component: add the key to `en.ts` **and** `pt-BR.ts`, call `const t = useT();` at the top level of `<script>` (or of a `.svelte.ts` helper called at component init; `useT` reads Svelte context, so it cannot run in event handlers or module scope), read `t().group.key` in markup/`$derived`, and use `label ?? t().group.key` when there is a prop. Never import a global `t`.
- In browser tests, call `setLocale("pt-BR")` where the test checks Portuguese text and `setLocale("en")` in `afterEach`; the default is English. SSR tests (`*.ssr.test.ts`, `bun run test:ssr`) wrap the tree in `I18nProvider`.
- The date/number `locale` (`DatePicker locale="pt-BR"`, masks) is independent of the UI language.

---

## AppShell: usage pattern

```svelte
<!-- In any authenticated app layout -->
<AppShellLayout
  modules={MODULES}
  pathname={$page.url.pathname}
  persistPanel={false}
  onNavigate={(path) => goto(path)}
>
  {#snippet brand()}
    <!-- Logo at the top of the Rail and in the mobile header. Without it: "CA" -->
    <a href="/" aria-label="Acme"><AcmeLogo size={28} /></a>
  {/snippet}

  {#snippet railBottom()}
    <!-- Fixed items at the bottom of the rail: notifications, avatar, search -->
    <button class="ca-rail-btn" onclick={() => (cmdOpen = true)}>
      <Search size={16} />
    </button>
    <NotificationBell {notifications} />
    <a href="/profile" class="ca-rail-avatar">
      <Avatar alt={user.name} size="sm" />
    </a>
  {/snippet}

  <!-- No {#snippet header()}. The global header was removed -->
  <!-- Each page defines its own "header" via AppList/AppForm/AppSettings/PageShell -->

  {@render children?.()}
</AppShellLayout>
```

**Rule:** `AppShellLayout` has no global header. Each page defines its own top via `AppList` (header+toolbar), `AppForm` (header), `AppSettings` (header), or `PageShell` (header+body).

---

## Relationship with consuming projects

Every app that consumes the package must:
1. Install `@codeatlasdev/ui` from public npm (no `.npmrc`/auth)
2. Import `@codeatlasdev/ui/styles/global.css` in the root layout and register `caThemePlugin()` in `vite.config.ts`
3. Define the brand theme (`ThemeOptions`) and pass it to `caThemeHandle` and `caThemePlugin`
4. Use `AppShellLayout` as the root layout wrapper, with `brand` for the logo and `railBottom` for user actions
5. Build pages with `AppList`, `AppForm`, `AppSettings`, or `PageShell`, never manual wrappers

---

## Code conventions

- Indentation: tabs (Biome)
- Quotes: double (Biome)
- Semicolons: always
- `lineWidth`: 100
- No Tailwind: styles via CSS vars and classes
- No MUI in this package: it is pure Svelte on its own primitives layer (`src/lib/primitives`)
- No inline CSS except dynamic CSS custom properties (`style="--bar-w:{pct}%"`)


## Performance (package guards)

- `bun run --cwd packages/ui size` (part of `validate`) bundles each entry with esbuild and compares the gzip size with `packages/ui/size-limit.json`. The limit only goes down: `size:update` lowers limits with some headroom; raising a limit is a manual decision, explained in the PR. To add an entry, edit `ENTRIES` in `scripts/size-limit.ts`.
- `bun run --cwd packages/ui lint:tokens` (part of `validate`) rejects: `will-change` in a file with `backdrop-filter`; a literal `100vh|100dvh|100svh|100lvh` (use `var(--ca-vh)`); `backdrop-filter` declared before `-webkit-backdrop-filter` (Lightning CSS drops the standard one); `font-size` < 16px in an input rule (iOS focus zoom).
- Content images: `Image` (requires `width`/`height`; `alt=""` requires `decorative`; `priority` only on the LCP image).
- Fonts: `defineTheme({ fonts: { body: { family, src, weight, preload, fallback, fallbackMetrics } } })` generates `@font-face`, the fallback with `size-adjust` and the `<link rel="preload">`. A plain string still works.
