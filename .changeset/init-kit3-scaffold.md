---
"@codeatlasdev/ui": minor
---

`init --write` now produces a SvelteKit app that passes `vite build`, `svelte-check --fail-on-warnings` and `codeatlas-ui lint` as written, on Kit 2 and Kit 3.

- **PWA and SEO are opt-in.** The manifest route, service worker, offline page, `robots.txt` and `sitemap.xml` are written only with `init --with pwa` (also combinable: `--with lint,e2e,pwa`). A plain `init` writes no `manifest` link in `<Seo>` (the old default failed the prerender with a 404 as soon as the manifest route was removed). `--with pwa` can be added later to an app `init` already set up.
- **Lint-clean output.** The copy `init` writes (layout title, offline page, manifest name) lives in `src/lib/messages.ts` (`export const m`), so `codeatlas-ui lint` no longer reports `i18n-literal` on a freshly initialised app.
- **Kit 3 `#lib/*` map.** `init` adds `"imports": { "#lib/*": "./src/lib/*" }` to `package.json` (never replacing an existing map) and imports the theme and messages through it, instead of relative paths.
- **Missing config files are created**: `vite.config.ts`, `src/app.html` (without the inline-styled `display: contents` wrapper) and `tsconfig.json` instead of `skip ... (not found)`. Kit 2's `tsconfig.json` gets `allowImportingTsExtensions`, `noEmit` and `skipLibCheck`, which its generated base config lacks; an existing file only gains the options it does not set.
- **`@sveltejs/adapter-static`**: the adapter output folder (`build`, or the `pages` option) goes into the tsconfig `exclude`, so `svelte-check` no longer scans it, and `src/routes/+layout.ts` gets `export const prerender = true;`. `init` notes when the adapter major does not pair with the Kit major (`@sveltejs/adapter-static@4` for Kit 3, `@3` for Kit 2).
- **`prerender.handleUnseenRoutes: "ignore"`** is written into the `vite.config.ts` that `--with pwa` creates on Kit 3 (no page links to `/robots.txt` or `/sitemap.xml`), and noted otherwise.
- **Fixed the public-origin note.** Kit 2 rejects `kit.paths.origin`; the mechanism is `kit.prerender.origin` there and `sveltekit({ paths: { origin } })` on Kit 3.
- A re-run no longer mistakes the theme import `init` wrote into `vite.config.ts` for an app-owned theme.
