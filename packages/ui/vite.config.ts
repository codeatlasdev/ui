import { existsSync, globSync, readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { playwright } from "@vitest/browser-playwright";
import { searchForWorkspaceRoot } from "vite";
import { defaultExclude, defineConfig } from "vitest/config";
import { cpuCap } from "../../scripts/cpu-cap.ts";
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

/** Build-time and server-side peers: never imported by a component a browser test renders. */
export const NODE_ONLY_PEERS = [
	"svelte",
	"@sveltejs/kit",
	"astro",
	"typescript",
	"@resvg/resvg-js",
	"png-to-ico",
];

/** Dependencies and browser-side peers of the package that are installed here (#959). */
function browserDeps(): string[] {
	const here = fileURLToPath(new URL(".", import.meta.url));
	const pkg = JSON.parse(readFileSync(`${here}package.json`, "utf8")) as Record<
		string,
		Record<string, string>
	>;
	const deps = [
		...Object.keys(pkg.dependencies ?? {}),
		...Object.keys(pkg.peerDependencies ?? {}),
	].filter(
		(d) => !NODE_ONLY_PEERS.includes(d) && existsSync(`${here}node_modules/${d}/package.json`)
	);
	// Vite pre-bundles each imported subpath as its own entry (`echarts/core`), so list them too (#1007).
	const subpaths = new Set<string>();
	for (const file of globSync("src/lib/**/*.{ts,svelte}", { cwd: here })) {
		if (/\.test\.(ts|svelte)$/.test(file)) continue;
		for (const m of readFileSync(`${here}${file}`, "utf8").matchAll(
			/from\s+["']([^"'.][^"']*)["']/g
		))
			if (deps.some((d) => m[1].startsWith(`${d}/`))) subpaths.add(m[1]);
	}
	return [...deps, ...subpaths];
}

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

const browserWarmup = [
	"./tests/setup.browser.ts",
	"./tests/setup.vrt.ts",
	"./tests/a11y.ts",
	"./src/lib/testing/index.ts",
	"./src/lib/styles/global.css",
];

export default defineConfig({
	plugins: [svelte()],
	server: {
		fs: { allow: [searchForWorkspaceRoot(process.cwd()), ...fontDirs] },
		// Every browser page imports these first, all pages at once, against a server that has transformed
		// nothing yet. Under load that first burst took 1.5 to 7 s and sometimes failed the import ("Failed
		// to fetch dynamically imported module", #640): transform them when the server starts instead.
		// tests/vitest-warmup.test.ts fails when a setup file is missing here.
		warmup: { clientFiles: browserWarmup },
	},
	// Pre-bundle every package a browser test can reach. One Vite discovers mid-run is re-optimised and the page
	// reloads, which fails every import in flight: 213 to 1513 component tests in one land gate (#959; axe-core
	// in checkA11y before it, #740). Derived from package.json, so a new dependency cannot bring the reload back;
	// a peer that is not installed here cannot be reached by a test and is left out (Vite fails on it).
	optimizeDeps: { include: browserDeps() },
	test: {
		expect: { requireAssertions: true },
		// Locally: the tooling's worker cap (scripts/cpu-cap.ts; each worker is a browser tab in one Chromium). CI keeps the default.
		maxWorkers: process.env.CI ? undefined : cpuCap(),
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
