import { realpathSync } from "node:fs";
import { availableParallelism } from "node:os";
import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { playwright } from "@vitest/browser-playwright";
import { searchForWorkspaceRoot } from "vite";
import { defaultExclude, defineConfig } from "vitest/config";
import TimingReporter from "./tests/timing-reporter.ts";

// The self-hosted typefaces of the screenshot setup (tests/setup.vrt.ts). A package manager that links
// `node_modules` into a store outside the workspace (bun's global cache) puts their .woff2 files outside
// the directories Vite serves, and every screenshot test then fails with a NetworkError: allow them.
const fontDirs = ["inter", "jetbrains-mono"].flatMap((name) => {
	try {
		return [
			realpathSync(
				fileURLToPath(new URL(`./node_modules/@fontsource-variable/${name}`, import.meta.url))
			),
		];
	} catch {
		return [];
	}
});

const browserPattern = "src/**/*.svelte.test.ts";
const vrtPattern = "src/**/*.vrt.test.ts";
const ssrPattern = "src/**/*.ssr.test.ts";
// Factory, not a shared object: Vitest mutates `instances` (it writes the project name into
// each entry), so sharing one array between projects mislabels and cross-wires them.
// Every browser carries the run id from scripts/test-run.ts, so an interrupted run can be cleaned
// up without touching other projects' Playwright browsers.
const runTag = process.env.CA_TEST_RUN ? [`--ca-test-run=${process.env.CA_TEST_RUN}`] : [];
// `channel` "chromium" = full Chrome for Testing (needed for VRT pixels, which are generated with
// it); behavior tests run on the lighter headless shell (same Blink engine, faster to start).
const browserBase = (channel?: "chromium") => ({
	enabled: true,
	headless: true,
	provider: playwright({ launchOptions: { ...(channel ? { channel } : {}), args: runTag } }),
	instances: [{ browser: "chromium" as const, viewport: { width: 1280, height: 720 } }],
	locators: { errorFormat: "aria" as const },
	trace: "retain-on-failure" as const,
});

export default defineConfig({
	plugins: [svelte()],
	server: { fs: { allow: [searchForWorkspaceRoot(process.cwd()), ...fontDirs] } },
	// Pre-bundle lazily imported deps so the first browser run doesn't trigger an optimizer reload.
	optimizeDeps: {
		include: ["echarts", "@tanstack/svelte-table", "shiki", "axe-core", "@deck.gl/maplibre"],
	},
	test: {
		expect: { requireAssertions: true },
		// Locally: a quarter of the cores (each worker is a browser tab in one Chromium). CI keeps the default.
		maxWorkers: process.env.CI ? undefined : Math.max(2, Math.floor(availableParallelism() / 4)),
		reporters: process.env.CI
			? ["default", "github-actions", ["html", { singleFile: true }], new TimingReporter()]
			: ["default", new TimingReporter()],
		projects: [
			{
				// SvelteKit-only modules used by kit/*.svelte (`$app/navigation`, `$app/state`); tests override it with vi.mock.
				resolve: {
					alias: [
						// Site demos import the package by name: render them against the source, not a stale dist.
						// A RegExp `find`: an object-form key is matched literally, and a bare string would also catch subpaths.
						{
							find: /^@codeatlasdev\/ui$/,
							replacement: fileURLToPath(new URL("./src/lib/index.ts", import.meta.url)),
						},
						{
							find: "$app/navigation",
							replacement: fileURLToPath(
								new URL("./tests/app-navigation.stub.ts", import.meta.url)
							),
						},
						{
							find: "$app/state",
							replacement: fileURLToPath(new URL("./tests/app-state.stub.ts", import.meta.url)),
						},
					],
				},
				test: {
					name: "browser",
					include: [browserPattern],
					setupFiles: ["./tests/setup.browser.ts"],
					browser: browserBase(),
				},
			},
			{
				// Server render through `svelte/server` in Node: proves nothing leaks between requests.
				test: {
					name: "ssr",
					environment: "node",
					include: [ssrPattern],
				},
			},
			{
				test: {
					name: "vrt",
					include: [vrtPattern],
					// Baselines are rendered natively and carry the platform in their name
					// (`Name-dark-glass-chromium-darwin.png`), so a platform is only ever compared with its own.
					// An empty `include` would fall back to Vitest's defaults, so exclude everything on a
					// platform without baselines instead.
					exclude: ["darwin", "linux"].includes(process.platform) ? defaultExclude : ["**/*"],
					setupFiles: ["./tests/setup.browser.ts", "./tests/setup.vrt.ts"],
					browser: {
						...browserBase("chromium"),
						expect: {
							toMatchScreenshot: {
								comparatorName: "pixelmatch",
								comparatorOptions: { threshold: 0.2, allowedMismatchedPixelRatio: 0.005 },
							},
						},
					},
				},
			},
		],
	},
});
