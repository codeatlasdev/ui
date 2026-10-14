import { defineConfig, devices } from "@playwright/test";

const port = process.env.E2E_PORT ?? "4321";
const baseURL = `http://localhost:${port}`;
const desktop = { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } };

export default defineConfig({
	testDir: "./tests",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	failOnFlakyTests: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	// Every core on CI runners (4 vCPU); shards split the suite across jobs.
	workers: process.env.CI ? "100%" : "50%",
	snapshotPathTemplate: "{testDir}/__screenshots__/{projectName}/{testFilePath}/{arg}{ext}",
	expect: {
		timeout: 5_000,
		toHaveScreenshot: {
			animations: "disabled",
			caret: "hide",
			scale: "css",
			threshold: 0.2,
			maxDiffPixelRatio: 0.002,
			stylePath: "./tests/screenshot.css",
			type: "webp",
		},
	},
	reporter: process.env.CI
		? [
				["dot"],
				["github"],
				["html", { open: "never" }],
				["json", { outputFile: "test-results/results.json" }],
			]
		: [
				["list", { printFailuresInline: true }],
				["html", { open: "never" }],
			],
	use: {
		baseURL,
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
		locale: "pt-BR",
		timezoneId: "America/Sao_Paulo",
		reducedMotion: "reduce",
		serviceWorkers: "block",
		// Run id from scripts/test-run.ts: lets an interrupted run be cleaned up without touching
		// other projects' Playwright browsers.
		launchOptions: process.env.CA_TEST_RUN
			? { args: [`--ca-test-run=${process.env.CA_TEST_RUN}`] }
			: {},
	},
	projects: [
		{
			name: "desktop",
			testIgnore: /\.(a11y|visual|webkit)\.spec\.ts/,
			use: { ...desktop, colorScheme: "dark" },
		},
		{
			name: "mobile",
			testIgnore: /\.(a11y|visual|webkit)\.spec\.ts/,
			use: { ...devices["Pixel 7"], colorScheme: "dark" },
		},
		{ name: "a11y", testMatch: /\.a11y\.spec\.ts/, use: { ...desktop } },
		{
			name: "visual-desktop",
			testMatch: /\.visual\.spec\.ts/,
			ignoreSnapshots: process.platform !== "linux",
			use: { ...desktop },
		},
		{
			name: "visual-mobile",
			testMatch: /\.visual\.spec\.ts/,
			ignoreSnapshots: process.platform !== "linux",
			use: { ...devices["Pixel 7"] },
		},
		{
			name: "webkit",
			default: false,
			ignoreSnapshots: true,
			testIgnore: /\.(a11y|visual|webkit)\.spec\.ts/,
			use: { ...devices["Desktop Safari"] },
		},
		{
			name: "iphone",
			testMatch: /\.webkit\.spec\.ts/,
			use: { ...devices["iPhone 15"], colorScheme: "dark" },
		},
	],
	webServer: {
		// CI builds the site once and hands dist/ to every shard (E2E_PREBUILT=1).
		command: process.env.E2E_PREBUILT ? "bun run preview" : "bun run build && bun run preview",
		url: baseURL,
		reuseExistingServer: !process.env.CI,
		timeout: 300_000,
	},
});
