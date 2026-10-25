import { defineConfig, devices } from "@playwright/test";

// One port per checkout, derived from its path: 4321 is what every Astro project on a developer machine
// defaults to, and a run that silently reused ANOTHER project's server compared that site against this one's
// baselines (and committed its screenshots as baselines, #546). `E2E_PORT` overrides it.
const checkoutPort =
	43000 + ([...process.cwd()].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % 1000);
const port = process.env.E2E_PORT ?? String(checkoutPort);
const baseURL = `http://localhost:${port}`;
// Platforms with committed baselines; elsewhere the visual projects run but compare nothing.
const NATIVE_BASELINES: string[] = ["darwin", "linux"];
// Specs that are not behaviour specs: they have a project of their own below.
const NOT_BEHAVIOUR = /(\.(a11y|visual|webkit|axe)|dist-html|brand|routes)\.spec\.ts/;
const desktop = { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } };

export default defineConfig({
	testDir: "./tests",
	// Fails the run at once when the server on the port is not this site (see global-setup.ts).
	globalSetup: "./tests/global-setup.ts",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	failOnFlakyTests: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	// Every core on GitHub's hosted runners (4 vCPU, nothing else running); shards split the suite
	// across jobs. Anywhere else a quarter, even with CI=true: agent shells export it on a developer
	// machine that other projects share, and 12 Chromium workers running axe there starved each other
	// into random 30s timeouts on a different route every run, 3 workers passed 3 of 3 (#539).
	workers: process.env.E2E_WORKERS ?? (process.env.GITHUB_ACTIONS ? "100%" : "25%"),
	// The platform is part of the file name (`home-dark-darwin.webp`), like Vitest's `-chromium-darwin.png`: a baseline
	// is only ever compared on the platform that rendered it, so each platform keeps its own set side by side.
	snapshotPathTemplate:
		"{testDir}/__screenshots__/{projectName}/{testFilePath}/{arg}-{platform}{ext}",
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
				["./tests/timing-reporter.ts"],
				["dot"],
				["github"],
				["html", { open: "never" }],
				["json", { outputFile: "test-results/results.json" }],
			]
		: [
				["./tests/timing-reporter.ts"],
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
		// Behaviour specs, at both viewports.
		{
			name: "desktop",
			testIgnore: NOT_BEHAVIOUR,
			use: { ...desktop, colorScheme: "dark" },
		},
		{
			name: "mobile",
			testIgnore: NOT_BEHAVIOUR,
			use: { ...devices["Pixel 7"], colorScheme: "dark" },
		},
		// The page sweep (smoke + layout audit per route, `routes.spec.ts`): its own projects so it is its own gated
		// command (`test:routes`) and `test:e2e` (the behaviour specs) stays under five minutes on its own.
		{
			name: "routes-desktop",
			testMatch: /routes\.spec\.ts/,
			use: { ...desktop, colorScheme: "dark" },
		},
		{
			name: "routes-mobile",
			testMatch: /routes\.spec\.ts/,
			use: { ...devices["Pixel 7"], colorScheme: "dark" },
		},
		// Page rules read from `dist` with a DOM parser, no browser: once, on every page (not per viewport).
		{ name: "static", testMatch: /(dist-html|brand)\.spec\.ts/ },
		{ name: "a11y", testMatch: /\.a11y\.spec\.ts/, use: { ...desktop } },
		// axe on every route: its own project so it shards and runs beside the layout project.
		{ name: "axe", testMatch: /\.axe\.spec\.ts/, use: { ...desktop } },
		{
			name: "visual-desktop",
			testMatch: /\.visual\.spec\.ts/,
			ignoreSnapshots: !NATIVE_BASELINES.includes(process.platform),
			use: { ...desktop },
		},
		{
			name: "visual-mobile",
			testMatch: /\.visual\.spec\.ts/,
			ignoreSnapshots: !NATIVE_BASELINES.includes(process.platform),
			use: { ...devices["Pixel 7"] },
		},
		{
			name: "webkit",
			default: false,
			ignoreSnapshots: true,
			testIgnore: NOT_BEHAVIOUR,
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
		// `--ignore-lock`: always a foreground, one-off server. Astro 7 backgrounds `preview` when it
		// detects an AI agent (CLAUDECODE, AGENT, ...) and keeps a lock file; Playwright then sees the
		// command exit and a stale lock blocks the next run.
		command: `${process.env.E2E_PREBUILT ? "" : "bun run build && "}bunx astro preview --port ${port} --ignore-lock`,
		url: baseURL,
		// Never reuse a server found on the port: it may not be this site, or this build. Runs are serialised by
		// scripts/test-run.ts, so a busy port is another project's, and the run should say so, not use it.
		reuseExistingServer: false,
		timeout: 300_000,
	},
});
