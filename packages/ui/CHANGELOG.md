# Changelog

## 2.1.1

### Patch Changes

- 01b5188: `Steps`: a leading `<strong>`/`<b>` step title is a block, so its line no longer mixes the bold face with the list item's regular-face strut. That mixed line rounded to a different height between page loads, shifting content below each step by 1px.

## 2.1.0

### Minor Changes

- 62d18f8: Theme: port a palette by role and pick the page paper, without raw `--ca-*` overrides.
  
  - `PresetDefinition.colors: { light?, dark? }` takes role colors (`brand`, `background`, `sunken`, `surface`, `overlay`, `text*`, `border*`, `success`/`warning`/`info`/`error`). A per-scheme `brand` regenerates that scheme's brand ramp; `background` also drives `<meta name="theme-color">`. Scoped to the preset, so islands and preset switching keep working.
  - `paper: "mesh" | "plain" | "grid" | "dots" | "lines"` replaces the brand glow mesh with flat paper drawn in `--ca-outline-subtle`.
  - New `sketchbook` design style: journal on grid paper, serif display, square outlined cards with hard shadows.
  - Opt-in `@codeatlasdev/ui/styles/marks.css`: hand-drawn `.ca-mark-underline` and `.ca-mark-note` (arrow), painted with `--ca-mark-color`.
  - `@codeatlasdev/ui/astro` re-exports `designStyle`, `DESIGN_STYLES` and `mergeTheme`, so `astro.config` can use a recipe.

## 2.0.0

### Major Changes

- dbb7193: bits-ui is gone. Every interactive component now runs on the library's own headless layer (WAI-ARIA Authoring Practices, platform first): native `<dialog>` for Dialog, AlertDialog, Sheet, Drawer, Lightbox, CommandPalette and DocsSearch; native inputs for Checkbox, Switch and RadioGroup; own floating, dismiss, focus, roving-focus, listbox and presence primitives for Popover, Tooltip, DropdownMenu, Select, Combobox, Tabs, ToggleGroup, SegmentedControl, Slider, PinInput, Accordion, Collapsible, ScrollArea, Pagination, Avatar and the date family. Public props, classes and `data-state` attributes are unchanged.
  
  - Smaller bundles: AppShellLayout 41.2 → 35.1 kB gzip, form controls −18.7 kB, date family −45.2 kB.
  - No more `ssr.noExternal` for bits-ui and no WKWebView dialog workaround needed.
  - `Select` / `Combobox` with `required` block native form submit while empty and focus the trigger.
  - Disabled `Slider` now renders dimmed (the selector never matched before).
  - Interaction patterns were designed after studying Bits UI (credited in NOTICE).
  
  ### Breaking (upgrade notes)
  
  Props, exported types, `ca-*` classes and `data-state` attributes did not change. What changed is the DOM around overlays and the dependency set:
  
  - Modal overlays (Dialog, AlertDialog, Sheet, Drawer, Lightbox, CommandPalette, DocsSearch) are a single native `<dialog>` moved to `<body>`; the scrim is its `::backdrop`. CSS that targeted a separate overlay/scrim element or the old portal container no longer matches. Style `dialog.ca-overlay::backdrop` instead.
  - `--bits-*` CSS variables and `data-bits-*` attributes are gone (`--ca-anchor-width`, `--ca-accordion-height`, `--ca-collapsible-height`, `data-ca-day` replace the ones used internally).
  - `bits-ui` is no longer installed with the package. If your app imports from `bits-ui` directly, add it to your own dependencies.
  - Select no longer renders bits-ui's hidden `<input>`; `required` still blocks native form submit.

## 1.2.0

### Minor Changes

- e5b0fe8: Design tokens v2: every visual dimension is a theme knob, so one component set can render any design language.
  
  - New `defineTheme` options: `controlRadius`, numeric or named `density` (`compact`/`comfortable`/`airy`), `border`, `typography` (scale, weights, heading/label tracking and case, line height, measure), `elevation` (`soft`/`none`/`hard`/`glow`), `motion` (scale, easing personality), `iconStroke`, `noise`. `designTokens()` exposes the mapping.
  - Scales are parametric: spacing = 4px × step × `--ca-density` (new half steps 0.5/1.5/2.5/3.5 and 20/24), radius × `--ca-radius-scale`, type × `--ca-font-scale`, durations × `--ca-motion-scale` (0 under reduced motion). `[data-ca-tokens]` re-derives them inside an island.
  - Fluid layout tokens: `--ca-gutter`, `--ca-section-gap`, `--ca-content-max`, fluid display sizes `--ca-font-size-display-1..3`. Role tokens: `--ca-radius-control`, `--ca-control-height*`, `--ca-border-width*`, `--ca-border-color`, `--ca-font-weight-*`, `--ca-heading-*`, `--ca-label-*`, `--ca-line-height-*`, `--ca-measure`, `--ca-icon-stroke`, `--ca-noise-opacity`, `--ca-ease-emphasized`.
  - Material tiers read `--ca-mat-{tier}-{filter,fill,shadow}` and `--ca-mat-edge`. New surface styles: `outlined`, `neumorphic`, `clay`, `tonal` (alongside glass, frosted, solid, flat).
  - Design style recipes: `designStyle(id, overrides)` and `DESIGN_STYLES` for Swiss, Neobrutalism, Neumorphism, Glassmorphism, Material 3, Fluent 2, Apple HIG, Bento, Claymorphism, Y2K, Editorial and Terminal.
  - Headings read the theme's display family, heading weight, tracking and case; Lucide icons read `--ca-icon-stroke`.
  - One breakpoint scale (600/900/1200/1536) everywhere, enforced by the token lint, which also rejects malformed `svelte-ignore` comments.
- e5b0fe8: RadioGroup: `variant="cards"` (selectable cards with label and `description`, whole card is the hit area) and `aria-label`. Option ids are now unique per instance, so two groups with the same values on one page no longer share label targets. CodeTabs: a plain `code` tab renders inside the framed `.ca-code` block as a focusable scroll region.
- e5b0fe8: Remove the legacy theme editor generator: `editorTokensToCSS`, `editorPreviewCSS`, `DEFAULT_CONFIG` and the `ThemeConfig` type are gone, with no aliases.
  
  Replacement: `defineTheme()` + `themeCSS()` (or `designStyle(id, overrides)` for a recipe) cover every dimension the old hue/chroma/radius/spacing/shadow config exposed, and `[data-ca-tokens]` + `[data-style]` + `[data-theme-scope]` scope a theme to a single element. The theme editor at /theme/ is rebuilt on them: it starts from a design style recipe, edits any `ThemeDefinition` key and prints the exact `defineTheme({ ... })` call to paste.
  
  Migrate: `ThemeConfig.hue/chroma/lightL` → `presets: [{ id, color }]`; `radiusBase` → `radius`; `spacingBase`/paddings → `density`; `fontSans`/`fontMono` → `fonts`; `shadowIntensity` → `elevation`; `surfaceStyle` → `defaultStyle`.
- e5b0fe8: Viewport hardening:
  - `--ca-vh-min` (small viewport, `svh` with `vh` fallback) for full-screen sections, so a hero never hides its call to action behind the browser UI.
  - Focus is never obscured by sticky chrome: `scroll-padding-block` on `:root` accounts for the header, safe areas and `--ca-sticky-top` / `--ca-sticky-bottom`.
  - Prose heading anchors are always visible on touch screens (no hover-only affordance).
  - BottomNav labels use an 11px floor.
  - SimpleTable `responsive="cards"` captions every cell with its column header automatically; `data-label` only overrides.
  - `caThemeHandle` warns in dev when the viewport meta blocks zoom (`user-scalable=no`, `maximum-scale=1`).

## 1.1.0

### Minor Changes

- f7d9a25: Accessibility foundations.
  
  - New `SkipLink` component (`ca-skip-link`). `AppShellLayout`, `DocsShell` and `AuthLayout` render it as the first tab stop and own the `#main` target. `DocsShell` keeps its `ca-docs-skip` class and `docs.skipToContent` label, but its `<main>` id is now `main` (was `ca-docs-content`): update any CSS or links that targeted `#ca-docs-content`. `AppShellLayout` gets `mainId` (default `"main"`; pass `null` when your page renders its own `<main id="main" tabindex="-1">`) and `skipLink` (set `false` when the shell is embedded in a page that already has one).
  - New `announce(message, politeness)` backed by one shared live region. `CopyButton` now announces through it (its local `ca-copy__status` element is gone), and `Button`/`IconButton` announce "Finished loading" when `loading` ends. New `RouteAnnouncer` in `@codeatlasdev/ui/kit` announces SvelteKit navigations (document title, or the page `<h1>`).
  - `forced-colors: active` support: glass, blur and shadows are removed, surfaces get a `CanvasText` border and focus uses `Highlight`.
  - `prefers-contrast: more` tokens (text-secondary and text-hint at 7:1 or more, outlines at 3:1 or more) are emitted per preset by the theme generator, so built-in and brand presets from `defineTheme` both get them. Built-in theme CSS is regenerated.
  - `Combobox` gets an `ariaLabel` prop to name the control when there is no visible `label`.
- fa63ddd: Developer and agent tooling.
  
  - `ca-ui-mcp`: a local MCP server (stdio) with `list_components`, `get_component`, `search_tokens` and `get_guide`, backed by manifests generated from the component source. Works offline.
  - `components.json` and `tokens.json` are generated on every build and exported as `@codeatlasdev/ui/components.json` and `@codeatlasdev/ui/tokens.json` (props, types, defaults, snippets, public `ca-*` classes, `--ca-*` tokens).
  - `codeatlas-ui` CLI. `init` wires the theme, hook or integration, `global.css`, `colorScheme.init()` and the mobile viewport into a SvelteKit or Astro app without overwriting existing files (it prints a diff; `--write` applies it). `migrate` is a codemod that renames `BrandPreset` to `PresetDefinition`.
  - Dev-only `[ca-ui]` warnings for `IconButton` without an accessible name and `Dialog` without a `title`.
- 0128aee: Performance foundations.
  
  - New `Image` component: required `width`/`height` (no layout shift), lazy by default, `priority` for the LCP image (eager, `fetchpriority="high"`, preload link), `decorative` for presentational images, dev warnings for missing dimensions and `alt=""` without `decorative`.
  - `defineTheme({ fonts })` accepts font descriptors (`family`, `src`, `weight`, `display`, `preload`, `fallback`, `fallbackMetrics`): the theme CSS emits `@font-face` plus a `size-adjust` fallback face, and `themeHead`/`caThemeHandle` emit `<link rel="preload" as="font" crossorigin>`. Plain stack strings keep working. New exported types `FontDescriptor`, `FontFallbackMetrics`, `FontSpec`.
  - New stylesheet entries `styles/core.css` (everything plus the default amber preset) and `styles/presets/<id>.css` (one built-in preset each). `styles/global.css` still imports everything.
  - Internal: bundle-size budget (`bun run size`), token lint (`lint:tokens`), both part of `validate`. Built-in preset sources moved from `styles/themes/` to `styles/presets/` (not a published path).
- 7abc0f9: Add the `@codeatlasdev/ui/seo` entry point: a `Seo` head component (title template, canonical, robots, hreflang, Open Graph, Twitter, JSON-LD with `<` escaped), typed JSON-LD builders (`organization`, `website` with `SearchAction`, `softwareApplication`, `product`, `faqPage`, `breadcrumbList`, `article`, `graph`), `sitemapXml` and `robotsTxt`, `llmsTxt` and a `markdownNegotiation` SvelteKit handle for AI crawlers, `ogImageRoute` for 1200x630 social images through an injected headless browser, and PWA helpers `manifest()` and `appleMeta()`. `caThemeHandle` now warns in development when the final HTML has no `viewport-fit=cover` or no `lang` on `<html>`. `esm-env` is now a direct dependency (dev-only warnings).

### Patch Changes

- 7bcfd57: Browser chrome color sync no longer gets stuck when the page starts in the background (or WebKit pauses its frames): a timeout backs up `requestAnimationFrame`, and the color re-syncs when the tab becomes visible.
- cd94a19: Browser chrome color sync re-samples after CSS transitions end, so the status bar no longer keeps an in-between color when a theme switch animates the header background.
- c9099ba: `CommandPalette`: pressing Enter on a result closes the palette again with bits-ui 2.19. Closing returns focus to the element that opened it while the Enter key is still down, and the browser then activated that element and reopened the palette; the palette now closes on `keyup`. Also builds with `@sveltejs/package` 3 and TypeScript 6.

## 1.0.0

### Major Changes

- ef015e6: **1.0.0: stable API.** From here on, breaking changes to props, exports, `--ca-*` tokens or the public `ca-*` classes (see `docs/css-api.md`) only land in a major.
  
  ### Breaking
  
  - **Default UI strings are English** and come from a typed catalog (`en`, `pt-BR`). Portuguese apps call `setLocale("pt-BR")` once in the root layout; the wording is the same as before. Text props (`label`, `placeholder`, `confirmLabel`, `emptyText`, …) no longer have hardcoded defaults: omit them to use the catalog, pass them to override.
  - **`ThemeOptions` is now `Partial<ThemeDefinition>`** (`defineTheme`). `BrandPreset` is removed: use `PresetDefinition` (`{ id, color, label? }`). `brandPresetCSS` output changed (theme islands) and the head style id is `ca-theme` (was `ca-brand-presets`).
  - **CSS is layered:** `global.css` declares `@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.components, ca.materials, ca.utilities`. App CSS stays unlayered and wins without `!important`; override a token by declaring `--ca-*` on `:root`.
  - **Page background:** `html` paints a solid `--ca-surface-base` and the decorative mesh moved to `body::before` (Safari 26 and the overscroll area sample the root color). `body` is transparent.
  - **`MobileHeader` and `BottomNav` are opaque** (`--ca-chrome-surface`) so the browser status bar and toolbar match them.
  - **`autofocus` on touch devices** only focuses when the keyboard was primed in the opening tap (`primeKeyboard()`); pass `{ touch: true }` to force. This removes the iOS "focus without keyboard" jump.
  - **`responsive`** is `undefined`-width until `init()` runs (no hydration mismatch); derived values treat it as desktop.
  - The `.ca-app`-scoped 16px input rule and the `.ca-input-ios-safe` class are gone: every text field is covered globally.
  
  ### Theme engine
  
  - `defineTheme()` + `themeCSS()`: typed theme object compiled once to deterministic CSS: brand presets from one hex, fonts, radius multiplier, density, raw token overrides.
  - Built-in presets are generated from `theme/builtins.ts` (`bun run --cwd packages/ui themes`; `validate` fails if `styles/themes/*.css` is stale).
  - The init script validates stored preset/scheme/style against what the app knows (an old `ca-preset` no longer repaints the app in amber), applies `data-style` before first paint, sets `<meta name="theme-color">`, follows the OS under `system` before hydration and replays runtime tokens.
  - Theme islands: `data-theme-scope="light" | "dark"` and `data-preset` on any element, nested in any order.
  - `colorScheme.setTokens(vars)` writes one `<style id="ca-runtime-tokens">`, persisted and replayed before paint. `colorScheme.init()` is idempotent and returns a cleanup; storage errors (Safari private mode) no longer throw. `colorScheme.presets` lists valid ids.
  
  ### Mobile and WebKit
  
  - Tokens `--ca-safe-top|right|bottom|left`, `--ca-vh` (dvh with vh fallback), `--ca-kb-inset`, `--ca-input-font-size(-sm)`, `--ca-chrome-surface`, `--ca-bottom-nav-h`.
  - `viewport` store (on-screen keyboard inset from `visualViewport`, ignores URL-bar and pinch-zoom changes) and the `keyboardAware` action.
  - `primeKeyboard()` / `focusTextField()` (from `@codeatlasdev/ui/actions`): open the iOS keyboard from the tap that opens a dialog, sheet or search. Used by `DocsSearch`, `CommandPalette` and `Combobox`.
  - Browser chrome color sync: `theme-color` follows the opaque color under the top edge (header, theme island or page) on Chrome/Samsung Android, Safari ≤ 18 and PWAs.
  - New components: `StickyActions`, `MobilePane`. `Sheet` swipe-to-dismiss (`swipeToDismiss`), `AuthLayout` `mobileBrand`.
  - 44px touch targets for every `Button` size, press feedback on touch, no tap flash, 16px minimum on every text field (no iOS zoom), `-webkit-text-size-adjust`.
  - Overlays contain overscroll; `backdrop-filter` falls back to opaque surfaces where unsupported.
  - `nativeFeel()` (kit): keyboard-only focus rings, no browser context menu or selection on chrome, `.ca-selectable` opt-in, optional zoom lock for desktop shells; `html[data-ca-surface="transparent"]` for vibrancy windows.
  
  ### Integrations
  
  - **Astro:** `caUI(theme)` from `@codeatlasdev/ui/astro` injects the theme before first paint and configures SSR.
  - `CodeTabs` accepts `tabs` as data (for MDX/Astro where Svelte context cannot reach children); `CodeSnippet` and code tabs follow the scheme of their context through dual shiki themes.
  
  ### Fixes
  
  - Glass lost its blur in production builds: Lightning CSS (Vite 8) drops `backdrop-filter` declared before `-webkit-backdrop-filter`. Order fixed everywhere and guarded by a test.
  - `Dialog` body no longer collapses to zero height in WKWebView (Tauri, Safari).
  - `Select` no longer puts `aria-required` on the trigger button; required state goes to the form control and the label.
  - `isItemActive` handles trailing slashes (`trailingSlash: "always"` sites).
  - `Tooltip` meets AA contrast in both schemes (`--ca-tooltip-bg`).
  - New tokens `--ca-focus-ring`, `--ca-focus-ring-offset`, `--ca-selection-bg`, `--ca-scrollbar-thumb(-hover)`; reduced motion zeroes `--ca-duration-*`.

## 0.7.1

### Patch Changes

- Charts now re-theme on a color scheme, preset or surface style change. Their options read design tokens from CSS custom properties, which aren't reactive, so a theme switch re-applied the previous theme's axis, text and palette colors. Token reads now track the theme store, so every chart option rebuilds with the new values.

## 0.7.0

### Minor Changes

- Accessibility and behavior fixes found by the new test suite.
  
  - New tokens `--ca-text-hint`, `--ca-brand-text` and `--ca-semantic-error-fill` (WCAG AA contrast). Hints, placeholders and brand-colored text now use them.
  - `DropdownMenu`, `Popover` and `Tooltip` accept a `triggerChild` snippet that receives the trigger props, so a `Button` can be the trigger without nesting interactive elements. `Button` and `IconButton` forward extra attributes.
  - `Checkbox` and `Switch` accept `aria-label` and `aria-labelledby`. `Switch` is now 44×24 px.
  - Fixed: Combobox popup position and keyboard focus; MoneyInput lost typed input; `use:mask` fired `input` twice per keystroke; DataTable `aria-sort`, page reset and column toggle; `colorScheme.resolved` did not follow OS changes in `system` mode; calendar navigation labels in pt-BR; DatePicker popover focus; Toaster, NotificationBell, Select, FileUpload, ScrollArea and SettingItem ARIA issues.
  - CodeSnippet uses the high-contrast GitHub shiki themes.
  - `DocsSearch` results are real links again (`<a role="option" href>`), so middle-click, open in new tab and copy link work. A plain click still goes through `onselect`.
  - `CommandPalette` gains `minQueryLength` (default `1`). The query is now trimmed before matching, so `" rel "` finds "Relatórios".

## 0.6.0

### Minor Changes

- Docs primitives for developer documentation sites, mobile-first.
  
  - `DocsShell`: page frame with sticky glass header (brand, section tabs, search, theme), sidebar + "Nesta página" rail on desktop, and ONE compact header on phones (safe-area insets, 44px targets) whose menu opens a bottom `Sheet` with a section switcher and the sidebar tree. The page index becomes an inline disclosure on small screens. ⌘K / Ctrl+K / `/` open search; skip link included. Props: `sections`, `active`, `groups`, `pathname`, `headings`, `searchIndex`, `onnavigate`, `brand`, `actions`, `menuFooter`.
  - `DocsNav` (sidebar tree with `MethodBadge`), `TableOfContents` (`variant="rail" | "inline"`, scrollspy), `DocsSearch` (dialog on desktop, full-height sheet with a 16px input on phones; accepts entries or an async loader) and the `searchDocs` ranking helper.
  - `CodeTabs` / `CodeTab`: language tabs with keyboard support, 44px targets, scrollable strip, copy button, and preference sync across groups (`sync` key, persisted in localStorage; first paint always renders the first tab so SSR hydrates cleanly).
  - `Callout` (note, tip, caution, danger; built on `Alert`), `Steps`, `LinkCard`, `CardGrid`, `MethodBadge`.
  - `.ca-prose` typography in `global.css`: headings with balanced wrapping, links, inline code that wraps, tables in `.ca-table-wrap` (scrollable, focusable), shiki dual-theme code blocks in `.ca-code`, tight mobile spacing, reduced motion.
  - Showcase: Navigation / Docs.

## 0.5.2

### Patch Changes

- AppShellLayout: skip the desktop panel for modules with a single destination, so the rail item, panel entry and page title no longer repeat the same label.

## 0.5.1

### Patch Changes

- Mobile polish.
  
  - Inputs no longer trigger Safari's focus zoom: TextField, TextArea, Select, NumberField, Combobox, CommandPalette and the DataTable search/page-size fields use `max(16px, var(--ca-font-size-body2))` under `(pointer: coarse), (max-width: 767px)`. `base.css` adds the same rule for raw `input, textarea, select` inside `.ca-app` and a `.ca-input-ios-safe` helper class. Zoom itself is never disabled.
  - New `Sheet` component: bottom sheet (`bind:open`, `title`, `description`, `onclose`, `children`, `footer`) with drag handle, safe-area padding, focus trap, Escape/backdrop close and reduced-motion support; centered dialog from 768px.
  - `AppShellLayout` gains `mobileTitle` snippet that replaces the plain page-title text in the mobile header (tappable session title, etc.).
  - `AppList`, `AppSettings`, `AppForm`, `PageShell`: inside `AppShellLayout` the h1 is visually hidden below 900px (kept for a11y) because the mobile header already shows the title; below 768px the actions wrap under the description, full-width.
  - `EmptyState` gains `variant="hero"`: larger brand-tinted icon tile with glow, bigger title, actions stacked full-width on mobile.
  - Button: disabled `filled` keeps the brand hue (AA fill + contrast text at 0.45 opacity) instead of looking muddy.
  - `AppSettings` (mobile): tabs in the horizontal strip were inheriting `width: 100%` and each filled the row; they now size to content, with a 36px touch target, scroll-snap and a trailing edge fade.
  - `AppList` / `useListState`: new `ofLabel` option (default `"of"`) for the word in the auto count and page info; pass `"de"` for pt-BR ("5 de 5"). On mobile the auto search field now fills the toolbar instead of keeping its 180px minimum.

## 0.5.0

### Minor Changes

- AppShell (mobile): one compact sticky header. New `mobileHeaderActions` snippet on `AppShellLayout` renders at the header's trailing edge (switchers, account menu), so apps no longer need a second bar under the header. The header pads for `env(safe-area-inset-top)`; `BottomNav` extends its background through `env(safe-area-inset-bottom)` over an opaque base (no dark band above Safari's toolbar), uses equal shrinkable columns with ellipsised 10px labels so five items fit at 320px, and has 44px touch targets. Apps must set `viewport-fit=cover` in their viewport meta for the insets to apply.
  
  Theme: new `--ca-brand-fill` / `--ca-brand-fill-hover` tokens in every static theme and in generated brand presets. `--ca-brand-contrast` text on `--ca-brand-fill` is at least WCAG AA (4.5:1): white is preferred, the fill is darkened (hue and chroma kept) when needed, and ink text is used only for very light brands. `generatePreset` now picks the text colour by real contrast instead of an L threshold; Button/IconButton filled, Badge brand, active Tabs, Pagination, Checkbox, Stepper and the nav badge now use the fill tokens. Disabled filled Button keeps the AA pair at 0.6 opacity.
  
  New `Lightbox` component: full-screen image viewer (`bind:open`, `src`, `alt`, `onclose`) with focus trap/restore, Escape, backdrop and close-button dismissal, safe-area insets and reduced-motion support.

## 0.4.4

### Patch Changes

- Dark themes: `--ca-brand-contrast` is now white. Text and icons on brand fills (primary Button, IconButton, Badge, active Tabs, Checkbox, Pagination, Stepper, PanelNavItem) were near-black on the dark presets. APCA contrast on the dark brand fills: white Lc 70–84 vs near-black Lc 31–45 on every preset (WCAG 2 ratios favor black on crimson/cyan/emerald/ocean/slate, a known WCAG 2 error for mid-tone fills in dark mode).
  
  Dialog: new `size="xl"` (820px) for two-pane layouts such as settings.
  
  Kbd: flat keycap (tinted fill, heavier bottom edge) instead of a glass blur, which rendered as a near-black block on dark surfaces.

## 0.4.3

### Patch Changes

- SvelteKit 3 support: `useBreadcrumbs` and `usePageTitle` read `$app/state` (the removed `$app/stores` broke Kit 3 apps at import), and `caThemeHandle` derives its `Handle` type from `@sveltejs/kit/hooks` so it type-checks on Kit 2 and 3. The `@sveltejs/kit` peer range is now `^2.12.0 || ^3.0.0`. Hook return types are unchanged (`Readable`).

## 0.4.2

### Patch Changes

- `MobileHeader` fills the width of the mobile shell bar instead of shrinking to its title (the bar background covered only part of the screen).
- Tints no longer drift toward purple/pink. Every `color-mix` of a token with a neutral (gray tokens such as `--ca-glass-tint`, black, white) now mixes in OKLab: in OKLCH an achromatic color has hue 0°, so the hue was interpolated between the brand hue and 0°. Selected `Chip`, destructive `Button`/`DropdownMenuItem` hovers and other tinted surfaces now keep the brand or semantic hue.

## 0.4.1

### Patch Changes

- `Drawer`: overlay no longer renders above the panel. Depending on CSS load order the base `.ca-overlay` z-index (modal) won over the drawer one and blurred the open drawer.

## 0.4.0

### Minor Changes

- Brand themes and brand slot.
  
  - `caThemeHandle(options)` and `caThemePlugin(options)` accept `ThemeOptions`: `defaultPreset`, `defaultScheme` and `presets`, brand presets generated from one hex color and inlined in `<head>`. Before this, the init script always fell back to `amber`/`dark` and overrode `data-preset` set in `app.html`.
  - `colorScheme` starts from the configured defaults instead of hardcoded `amber`/`dark`.
  - `PresetId` accepts custom ids; `BuiltinPresetId` lists the eight shipped presets.
  - Charts use the brand hex as the first series color for brand presets (they fell back to amber).
  - `hexToOklch` and `brandPresetCSS`/`themeHead`/`themeScript` exported for custom setups.
  - `tokensToCSS` dark block now includes the neutral outline/glass/scrim tokens, so generated presets no longer inherit light-mode outlines in dark mode.
  - `AuthLayout` panel mixes brand with neutrals in OKLab: in OKLCH the hue swung toward 0° (blue brands rendered purple).
  - `AuthLayout` brand panel now hides below 768px (the override lost to the scoped rule); `AuthCard` footer links use the brand color.
  - `ThemeToggle`: light/dark button for the AppShell rail, SSR-safe icon.
  - `brand` snippet for the logo in `AppShellLayout` (top of the Rail and mobile header; `MobileHeader` gains `leading`) and in `AuthLayout`. Both default to the previous "CA" text mark.

## 0.3.0

### Minor Changes

- Breaking: charts, DataTable and CodeSnippet moved out of the root import into subpaths with optional peers, so the core install no longer pulls ECharts, TanStack Table or Shiki.
  
  | import from | install |
  |---|---|
  | `@codeatlasdev/ui/charts` | `echarts` |
  | `@codeatlasdev/ui/table` | `@tanstack/svelte-table` |
  | `@codeatlasdev/ui/code` | `shiki` |
  
  Migrate: change `import { LineChart } from '@codeatlasdev/ui'` to `'@codeatlasdev/ui/charts'` (same for `DataTable*`, `Table`, `createCaTable`, `createCaColumnHelper`, `caTableFeatures`, `PaginationState`, `SortingState`, `Updater` → `/table`, and `CodeSnippet` → `/code`), then install the matching peer. `SimpleTable` and `UserCell` stay in the root.

## 0.2.2

### Patch Changes

- New README: AI-first quick start with `npx skills add codeatlasdev/ui`.

## 0.2.1

### Patch Changes

- Charts load a modular ECharts build with only the series and components they use. The lazy chart chunk drops from 1,124 kB to about 650 kB (374 to about 218 kB gzip).

## 0.2.0

### Minor Changes

- Package exports now point to `dist` (fixes `@codeatlasdev/ui/vite` failing to load from `node_modules`). Adapted to the bits-ui 2 API (`Accordion` drops `collapsible`), swapped deprecated `lucide-svelte` for `@lucide/svelte`, and exported the shared `IconComponent`/`IconProps` types plus TanStack `PaginationState`, `SortingState` and `Updater`. The theme plugin no longer warns about FOUC when `caThemeHandle` is set in `hooks.server`.

All notable changes to `@codeatlasdev/ui` are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] 2026-09-26

### Added

- **60+ components** across page templates, navigation, data, forms, charts, overlays, and feedback
- **Page templates:** `AppList`, `AppForm`, `AppSettings`, `PageShell`: complete screen patterns in one component
- **Navigation shell:** `AppShellLayout` with `Rail`, `Panel`, `BottomNav`, `MobileHeader`, `SiteHeader`
- **Layout primitives:** `Grid`, `Row`, `Stack`: replace manual flex/grid entirely
- **Charts (8):** `LineChart`, `BarChart`, `PieChart`, `ScatterChart`, `HeatmapChart`, `GaugeChart`, `RadarChart`, `Sparkline`
- **Data:** `DataTable` (TanStack Table v9), `SimpleTable`, `Pagination`, `KpiCard`, `EmptyState`, `FilterGroup`
- **Forms (11):** `Button`, `TextField`, `TextArea`, `NumberField`, `Select`, `Combobox`, `Checkbox`, `RadioGroup`, `Switch`, `Slider`, `FileUpload`
- **Auth:** `AuthLayout`, `AuthCard`
- **Overlays:** `Dialog`, `Drawer`, `Popover`, `Tooltip`, `DropdownMenu`, `CommandPalette`
- **Feedback:** `Toast`, `Spinner`, `Skeleton`, `Progress`, `ErrorPage`
- **8 built-in OKLCH themes:** amber, ocean, crimson, cyan, violet, emerald, rose, slate: set via `data-preset` attribute
- **Liquid Glass material system**: `GlassCard`, `GlassSurface`, `GlassAppBar`, `LiquidGlass`
- **CSS token system**: `--ca-*` custom properties for color, spacing, radius, typography, z-index
- **SvelteKit helpers** (`@codeatlasdev/ui/kit`): theme handle, breadcrumbs, page title, error templates
- **Vite plugin** (`@codeatlasdev/ui/vite`): fixes SSR externalization for `@tanstack/svelte-table`
- **Dark mode**: independent from themes, compose freely (`data-preset="ocean" class="dark"`)
- **Svelte 5 runes throughout**: `$state`, `$derived`, `$props`, `$effect`, no legacy APIs
- **`.agents/skills/`**: AI agent skills for codeatlas-ui, DX, and writing

[0.1.0]: https://github.com/codeatlasdev/ui/releases/tag/v0.1.0
