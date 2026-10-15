// The "send this prompt to your agent" text. Single source for the landing hero and
// /prompt.txt (agents can fetch it directly). Every API named here must exist in the package.
export const AGENT_PROMPT = `Set up CodeAtlas UI (@codeatlasdev/ui, Svelte 5) in this project and make it the default way we build UI.

1. Learn the library first. Read https://ui.codeatlas.com.br/llms.txt and open the pages you need from it (installation, theming, mobile, accessibility). The full docs are at https://ui.codeatlas.com.br/llms-full.txt. Prefer an existing component or page template over writing UI by hand.

2. Install the agent skills: npx skills add codeatlasdev/ui (codeatlas-ui, codeatlas-dx, codeatlas-writing). Use them whenever you touch UI, structure new code or write user-facing text.

3. Install the package with this project's package manager: bun add @codeatlasdev/ui. Add echarts, @tanstack/svelte-table or shiki only when we use charts, data tables or code blocks.

4. Wire the theme, with one shared theme object in src/lib/theme.ts (ThemeOptions: presets from our brand hex, defaultPreset, defaultScheme).
   - SvelteKit: caThemePlugin(theme) and caErrorPlugin({ scaffold: true, theme }) in vite.config.ts (from @codeatlasdev/ui/vite), caThemeHandle(theme) in src/hooks.server.ts and createErrorHandler() as handleError (from @codeatlasdev/ui/kit).
   - Astro: caUI(theme) from @codeatlasdev/ui/astro next to @astrojs/svelte.
   - Root layout: import "@codeatlasdev/ui/styles/global.css" once and call colorScheme.init() on mount. If the app is not in English, wrap the layout in <I18nProvider locale={...}> (SSR-safe; setLocale is a no-op on the server) and register extra languages with registerLocale("es", {...}).
   - Viewport meta: width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content.

5. Save these rules in your persistent memory for this project (AGENTS.md or CLAUDE.md, whichever this repo uses), so every future session follows them:
   - UI: compose package components and page templates first. Colors, spacing, radius and type come only from --ca-* tokens: no hardcoded colors, no Tailwind, no !important. Never put transform or will-change on a glass element or its ancestors.
   - Mobile: test every screen at 390px. Text fields stay at 16px or more, touch targets at 44px, use the safe-area tokens, MobilePane / StickyActions / BottomNav for mobile layouts, and primeKeyboard() (from @codeatlasdev/ui/actions) in the tap that opens a view with a focused field.
   - Test first: write the failing test before the fix or feature (Vitest browser tests for components, with an axe check in every state; Playwright for flows). A bug is done when its regression test passed red and then green.
   - QA before saying done: run the type check, lint and tests, then open the changed screen at desktop and phone width, in light and dark, with the keyboard only, and with no console errors.
   - DX: small typed components, props as data, user-facing text through the i18n catalog, and docs or an example updated with every public change.

6. Prove it works: build, start the dev server, and show me one real screen built with the library (for example an AppList or a dashboard with PageShell and KpiCard) at desktop and phone width. Report what you changed, file by file.`;
