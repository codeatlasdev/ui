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

# Start the docs site (predev builds the package dist first)
bun dev
```

> The site consumes `@codeatlasdev/ui` from `packages/ui/dist`, so `build:pkg` is required at least once. `predev` runs it automatically on every `bun dev`. To pick up library edits while the dev server runs, keep `bun run --cwd packages/ui build:watch` open in a second terminal.

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

`issue:start` creates the worktree in `../ui-worktrees/<n>-<slug>` on `fix/<n>-<slug>` (or `feat/` for enhancements) from `origin/main`, installs dependencies, opens a **draft PR** with `Closes #<n>`, labels the issue `in progress`, assigns you and comments the PR link on the issue. If someone else is assigned, it stops: talk on the issue first.

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

CI (`.github/workflows/ci.yml`) runs the same gates. Locally, both must exit with code 0:

```bash
bun run validate   # generated themes, bun --check + svelte-check + astro check, Biome, unit tests, size budget
bun run test       # unit (bun test) + component tests (Chromium) + site E2E/a11y (Playwright)
```

Unit tests run on `bun test` (`bunfig.toml` points it at `packages/ui/tests`); component and visual tests need a real browser and stay on Vitest, so prefer `bun run test` for the full suite. Type checking is split by who understands the files: `bun --check` (the native checker, config in the root `tsconfig.json`) covers scripts, unit tests and Playwright specs, `svelte-check` covers `packages/ui` and `astro check` covers `site`. Bun >= 1.4.3 and Node >= 22.17 are required.

Browser tests always run through the package scripts (`bun run test:browser`, `test:e2e`, …), never a bare `vitest` or `playwright test`. The scripts go through `scripts/test-run.ts`, which tags this repo's browsers, tears them down on exit or Ctrl+C, and cleans up after runs that were killed hard. `bun run test:status` shows runs, `bun run test:reap` cleans dead ones. It never touches other projects' Playwright browsers.

Visual regression baselines are Linux-only, rendered in `mcr.microsoft.com/playwright:v1.64.0-noble` on amd64. `bun run test:vrt` compares locally in Docker. To regenerate, push your branch and run `bun run test:vrt:update`: it dispatches the CI job with `update-snapshots`, which renders on native amd64, commits the `__screenshots__/` changes to your branch and pulls them back (a few minutes, nothing runs locally). `bun run test:vrt:update:local` does the same in local Docker, much slower on Apple Silicon (amd64 emulation). Review the changed images before merging.

Fix any errors before opening a pull request. PRs with failing checks will not be merged.

## Commit style

This project uses [Conventional Commits](https://www.conventionalcommits.org):

```
feat: add GlassChip component
fix: correct backdrop-filter on Safari 17
docs: update contributing guide
chore: bump @floating-ui/dom to 1.8.0
refactor: extract chart palette helpers
```

Use the imperative mood in the subject line. Keep it under 72 characters.

## Release flow

Releases are fully automated with Changesets and GitHub Actions (`.github/workflows/release.yml`). Nobody publishes from a laptop.

1. Every PR that changes the published package adds a changeset: `bun changeset`, pick the bump, write the user-facing note.
2. Merging to a channel branch makes the Release workflow open (or update) a **Version Packages** PR with the bumped version and CHANGELOG.
3. Merging that PR publishes to npm with [provenance](https://docs.npmjs.com/generating-provenance-statements) through Trusted Publishing (OIDC, no npm token stored anywhere), pushes the git tag, creates the GitHub Release and deploys the docs.

`bun run release` runs the same gate locally: lint, type check, build, tarball smoke test (packs the library into a fresh SvelteKit app and builds it) and `changeset status`.

### Release channels

| Branch | npm dist-tag | Example | Install | Docs |
|---|---|---|---|---|
| `main` | `latest` | `1.2.0` | `bun add @codeatlasdev/ui` | ui.codeatlas.com.br |
| `beta` | `beta` | `1.3.0-beta.2` | `bun add @codeatlasdev/ui@beta` | beta.codeatlas-ui.pages.dev |
| `alpha` | `alpha` | `2.0.0-alpha.0` | `bun add @codeatlasdev/ui@alpha` | alpha.codeatlas-ui.pages.dev |

- **alpha:** breaking or experimental work for the next major. **beta:** feature-complete, API frozen, hunting bugs. **latest:** stable.
- Open a channel by branching from `main` and entering prerelease mode once: `git switch -c beta && bunx changeset pre enter beta`, commit `.changeset/pre.json`, push.
- Promote a channel by exiting prerelease mode on it (`bunx changeset pre exit`), then merging it into `main`. The workflow refuses to run on `main` while `.changeset/pre.json` exists, so a prerelease can never become `latest` by accident.
- Fixes land on `main` first and are merged forward into `beta`/`alpha`.

## Thank you

Every contribution matters, whether it's a typo fix, a new component, or a performance improvement. We appreciate it.

## Docs site deploy

The site is static and hosted on Cloudflare Pages (project `codeatlas-ui`, domain `ui.codeatlas.com.br`). Maintainers deploy from their machine:

```bash
bun run site:deploy                  # production
bun run site:deploy --branch my-pr   # preview at https://my-pr.codeatlas-ui.pages.dev
```

It needs `CLOUDFLARE_API_TOKEN` (Pages: Edit) and `CLOUDFLARE_ACCOUNT_ID` in your environment. Never commit them.
