import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { playwright } from "@vitest/browser-playwright";
import { defaultExclude, defineConfig } from "vitest/config";

const browserPattern = "src/**/*.svelte.test.ts";
const vrtPattern = "src/**/*.vrt.test.ts";
// Factory, not a shared object: Vitest mutates `instances` (it writes the project name into
// each entry), so sharing one array between projects mislabels and cross-wires them.
const browserBase = () => ({
	enabled: true,
	headless: true,
	provider: playwright({ launchOptions: { channel: "chromium" } }),
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
				test: {
					name: "vrt",
					include: [vrtPattern],
					// Baselines are Linux-only (scripts/vrt.sh runs Docker). An empty `include` would fall
					// back to Vitest's defaults, so exclude everything elsewhere instead.
					exclude: process.platform === "linux" ? defaultExclude : ["**/*"],
					passWithNoTests: true,
					setupFiles: ["./tests/setup.browser.ts", "./tests/setup.vrt.ts"],
					browser: {
						...browserBase(),
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
