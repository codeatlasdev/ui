# Contributing to @codeatlasdev/ui

Thanks for taking the time to contribute. This is a Svelte 5 glass-first design system. Every improvement is welcome: bug fixes, new components, docs, and ideas.

## Code of Conduct

By participating you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md). Please read it before contributing.

## Stack

| Tool | Role |
|---|---|
| [Bun](https://bun.sh) | Package manager + monorepo runner |
| [Svelte 5](https://svelte.dev) | Component authoring (runes mode only) |
| `src/lib/primitives` | Own headless layer (WAI-ARIA APG, native elements first); `@floating-ui/dom` and `@internationalized/date` are the only behavior deps |
| [Biome](https://biomejs.dev) | Linting + formatting |
| [Changesets](https://github.com/changesets/changesets) | Versioning + changelog |

## Setup

```bash
git clone https://github.com/codeatlasdev/ui.git
cd ui
bun install

# Package watcher + docs site in one command (builds dist/ once if missing)
bun dev
```

> The site consumes `@codeatlasdev/ui` from `packages/ui/dist`; `bun dev` keeps it current with `svelte-package --watch`, so library edits reach the running site.

## Project structure

```
packages/ui/src/lib/
├── components/   # UI components (Button, Card, Dialog, …)
├── charts/       # ECharts wrappers (LineChart, BarChart, …)
├── stores/       # Shared reactive stores
├── tokens/       # Design token helpers
├── styles/       # Global CSS, token definitions, themes
├── utils/        # Pure utility functions
├── actions/      # Svelte actions
├── kit/          # SvelteKit helpers (theme handle, error handler, page title, breadcrumbs)
└── vite-plugin.ts  # Vite plugin exposed as @codeatlasdev/ui/vite

site/             # Astro site: landing, docs (MDX + Svelte demo islands), templates
├── src/content/docs/<group>/<slug>.mdx   # one page per component or guide
├── src/demos/<group>/<slug>/*.svelte     # demo islands, shown with their source
└── src/templates/                        # full-app templates (/templates/)
```

## Working on an issue

One issue, one worktree, one branch, one draft PR. Claim the issue before you write code, so nobody duplicates it:

```bash
bun run issue:status        # open issues, who is on them, linked PRs
bun run issue:start 47      # claim #47 and set everything up
cd ../ui-worktrees/47-...   # work there; your main checkout stays untouched
```

`issue:start` creates the worktree in `../ui-worktrees/<n>-<slug>` on `fix/<n>-<slug>` (or `feat/` for enhancements) from `origin/main`, installs dependencies, opens a **draft PR** with `Closes #<n>`, labels the issue `in progress`, assigns you and comments the PR link on the issue. If someone else is assigned, or the issue already has an open PR, it stops and names it: talk on the issue or the PR first.

Then, in the worktree (use paths inside it; your editor or agent must not edit the main checkout):

1. **Understand and reproduce.** Write the regression test first and run it: it must fail on the current code. Paste that output in the PR.
2. **Fix** the root cause until the test passes. No workarounds for a symptom. Run every test you added or changed, Playwright included.
3. **Before review:** `bun run validate`, a changeset if the package changes, docs if behavior changed. Never bypass the pre-push hook (`--no-verify`, `LEFTHOOK=0`): a gate that fails only under load is a bug; open an issue for it.
4. **Landing (maintainers):** `sh scripts/issue-land.sh 47` rebases on `main`, rebuilds generated files (lockfile, API.md, components.json, css-api), validates, regenerates visual baselines on CI, waits until every check on the final head passed and squash-merges. GitHub closes the issue through `Closes #47`; the script then runs `issue:done` (worktree, branch and `in progress` label cleanup).

If you find the issue is already fixed or obsolete, prove it with a test that passes on `main`, comment that evidence on the issue and close it.

## Adding a component

1. Create `packages/ui/src/lib/components/<ComponentName>/<ComponentName>.svelte` using Svelte 5 runes mode.
2. Export it from `packages/ui/src/lib/index.ts`.
3. Add demos under `site/src/demos/<group>/<component-name>/` (one small Svelte file each) and a page `site/src/content/docs/<group>/<component-name>.mdx` with `title`, `description` and `group` frontmatter. Copy `site/src/content/docs/inputs/button.mdx`: `<Demo src={...?raw}>` shows each demo with its code, `<Props rows={...} />` documents the props. The sidebar, search, `llms.txt` and sitemap pick the page up automatically.
4. Interactive demos need `client:visible`; static ones render without JavaScript.
5. Run `bun dev` and check the page at desktop and phone widths.

## Code style

- **Formatter / linter:** Biome handles both. Run `bun run lint` to check and `bun run lint:fix` to auto-fix.
- **Svelte 5 runes only:** Use `$state`, `$derived`, `$effect`, `$props`. Do not use legacy `export let`, stores-as-props, or the Options API.
- **CSS custom properties:** All design values come from `--ca-*` tokens. Do not hardcode colors, radii, or spacing.
- **No Tailwind:** Utility classes are not used anywhere in this project.

## Before submitting a PR

**Test first.** A bug fix starts with a regression test that reproduces the problem: run it, watch it fail on the current code, then fix until it passes, and put that fail-before/pass-after evidence in the PR. Tests prove behavior; tests that only pad coverage (wiring, copies, mock echoes, incidental defaults) are rejected.

> **CI is paused** while the project is pre-stable: the `CI` workflow is disabled (`gh workflow disable ci.yml`) and `CI ok` is no longer a required check on `main`. The local gates are the gate: the pre-push hook runs `bun run validate`; run the browser suites (`bun run test:browser`, `test:e2e`) yourself when a change touches them. PR titles are still checked (`pr-title.yml`), and releases still run on tags. To turn CI back on: `gh workflow enable ci.yml` and add `CI ok` back as a required status check in the `main` ruleset.

CI (`.github/workflows/ci.yml`, when enabled) runs the same gates. Locally, both must exit with code 0:

```bash
bun run validate   # generated themes, bun --check + svelte-check + astro check, Biome, unit tests, size budget
bun run test       # unit (bun test) + component tests (Chromium) + site E2E/a11y (Playwright)
```

Unit tests run on `bun test` (`bunfig.toml` points it at `packages/ui/tests`); component and visual tests need a real browser and stay on Vitest, so prefer `bun run test` for the full suite. Type checking is split by who understands the files: `bun --check` (the native checker, config in the root `tsconfig.json`) covers scripts, unit tests and Playwright specs, `svelte-check` covers `packages/ui` and `astro check` covers `site`. Bun >= 1.4.3 and Node >= 22.17 are required.

Browser tests always run through the package scripts (`bun run test:browser`, `test:e2e`, …), never a bare `vitest` or `playwright test`. The scripts go through `scripts/test-run.ts`, which tags this repo's browsers, tears them down on exit or Ctrl+C, and cleans up after runs that were killed hard. `bun run test:status` shows runs, `bun run test:reap` cleans dead ones. It never touches other projects' Playwright browsers.

Git hooks (lefthook, installed by `bun install`): pre-commit formats staged files with Biome, commit-msg checks the message, pre-push runs `bun run validate`. Browser suites (`bun run test:browser`, `test:e2e`) run on CI and on demand.

Visual regression baselines are rendered only on CI (`ubuntu-24.04`); no Docker. To regenerate, push your branch and run `bun run test:vrt:update`: it dispatches the CI job with `update-snapshots`, which commits the `__screenshots__/` changes to your branch and pulls them back. Review the changed images before merging.

Fix any errors before opening a pull request. PRs with failing checks will not be merged.

## Commit style

This project uses [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/), checked by the commit-msg hook. Allowed types: `feat` `fix` `docs` `style` `refactor` `perf` `test` `build` `ci` `chore` `revert`, optional `(scope)`, `!` for breaking changes. PRs are squash-merged and the PR title becomes the commit on `main`, so CI checks PR titles with the same rules.

```
feat: add GlassChip component
fix: correct backdrop-filter on Safari 17
docs: update contributing guide
chore: bump @floating-ui/dom to 1.8.0
refactor: extract chart palette helpers
```

Use the imperative mood in the subject line. Keep it under 72 characters.

## Release flow

Publishing happens only in CI (`.github/workflows/release.yml`), triggered by a version tag. Nobody publishes from a laptop.

1. Every PR that changes the published package adds a changeset: `bun changeset`, pick the bump, write the user-facing note.
2. When it's time to ship, a maintainer runs `bun run release` on an up-to-date, clean `main` (`--dry-run` first to see what goes out). It applies the pending changesets (version + CHANGELOG), commits `chore(release): @codeatlasdev/ui@X.Y.Z`, tags it, pushes `main` and the tag atomically and watches the run.
3. The tag starts the Release workflow: `scripts/release-meta.ts` checks the tag against the package version, `bun run validate` and the tarball smoke test run on the tagged commit (it does not depend on CI), then it publishes to npm with [provenance](https://docs.npmjs.com/generating-provenance-statements) through Trusted Publishing (OIDC, no npm token), creates the GitHub Release from the CHANGELOG and deploys the docs to ui.codeatlas.com.br.

Prereleases: `bunx changeset pre enter beta`, commit `.changeset/pre.json`, then `bun run release` → `X.Y.Z-beta.N` on the `beta` dist-tag (never `latest`), docs at beta.codeatlas-ui.pages.dev. `bunx changeset pre exit` before the next stable.

A failed or half-finished release is re-run for the same tag with `bun run release --publish @codeatlasdev/ui@X.Y.Z`; steps already done (npm version, GitHub Release) are skipped.

`bun run release:check` runs the local gate: lint, type check, build, tarball smoke test (packs the library into a fresh SvelteKit app and builds it) and `changeset status`.

## Thank you

Every contribution matters, whether it's a typo fix, a new component, or a performance improvement. We appreciate it.
