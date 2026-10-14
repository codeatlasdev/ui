import { availableParallelism } from "node:os";
import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { playwright } from "@vitest/browser-playwright";
import { defaultExclude, defineConfig } from "vitest/config";

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
	// Pre-bundle lazily imported deps so the first browser run doesn't trigger an optimizer reload.
	optimizeDeps: { include: ["echarts", "@tanstack/svelte-table", "shiki", "axe-core"] },
	test: {
		expect: { requireAssertions: true },
		// Locally: half the cores (each worker is a browser tab in one Chromium). CI keeps the default.
		maxWorkers: process.env.CI ? undefined : Math.max(2, Math.floor(availableParallelism() / 2)),
		reporters: process.env.CI
			? ["default", "github-actions", ["html", { singleFile: true }]]
			: ["default"],
		projects: [
			{
				// SvelteKit-only module used by kit/route-announcer.svelte; tests override it with vi.mock.
				resolve: {
					alias: {
						"$app/navigation": fileURLToPath(
							new URL("./tests/app-navigation.stub.ts", import.meta.url)
						),
					},
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
					// Baselines are Linux-only (scripts/vrt.sh runs Docker). An empty `include` would fall
					// back to Vitest's defaults, so exclude everything elsewhere instead.
					exclude: process.platform === "linux" ? defaultExclude : ["**/*"],
					passWithNoTests: true,
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
