#!/usr/bin/env bun
/**
 * `bun run test` / `bun run test:changed`: run what the diff against origin/main affects, say what was
 * selected and why, and stay inside the `changed` time budget (scripts/test-run.ts). `--land` is the
 * same selection plus the route canaries, the gate `issue-land.sh` runs. `bun run test:full` runs the
 * whole suite and `bun run test:vrt` every screenshot; both run at release.
 *
 * A SHARED change (a shared component file, or a route-wide one: styles, tokens, theme, primitives, the
 * site layout, a test setup file, or a file the route map cannot place) runs every component test and, when
 * it reaches the site, every route, and NO screenshots: those run at release (`test:vrt`) and on demand.
 * `--print-budget` prints the budget this selection runs under (`land`, 180 s, or `landShared`, 300 s).
 *
 *   unit        `bun test --changed <base>` (module graph);
 *   components  the component tests whose imports reach a changed file (scripts/test-graph.ts; Vitest's
 *               own `--changed` selects every file in browser mode), or EVERY component test when a
 *               shared file changed (styles, tokens, theme, stores, primitives, a test setup file: all
 *               of them render through it);
 *   visual      component screenshots (`*.vrt.test.ts`) through the same module graph, and the site's visual
 *               project when a changed route is one of its five pages (landing, templates, theme);
 *   site        the docs routes whose source changed (scripts/route-impact.ts), or EVERY route when a
 *               changed file is shared by all pages or unknown to the map; changed non-route Playwright
 *               specs run themselves. A dev run needs `site/dist` to be fresh (a build is ~75 s, over
 *               the 60 s budget) and says so when it is not; `--land` builds and adds the canaries below.
 *
 * `CA_TEST_BASE=<ref>` compares against another ref (`CA_TEST_BASE=HEAD`: only what is not committed yet).
 *
 * Steps run one after the other under scripts/test-run.ts (machine-wide lock, 25% browser cap).
 * Extra args go to Vitest: `bun run test:changed -- --reporter=minimal`.
 */
import { spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { ROOT, select } from "./route-impact.ts";
import { affected, buildGraph, isSharedComponent, landBudget } from "./test-graph.ts";

if (!import.meta.main) throw new Error("scripts/test-changed.ts is a command, not a module");

/** One page per layout family, always retested at land: home, the biggest docs page, the app shell, an app template, the theme editor. */
const CANARIES = [
	"/",
	"/docs/getting-started/recipes/",
	"/docs/layout/app-shell/",
	"/templates/app/dashboard/",
	"/theme/",
];

/** The routes `pages.visual.spec.ts` captures (keep in step with its PAGES). */
const VISUAL_ROUTES = new Set([
	"/",
	"/templates/",
	"/templates/app/dashboard/",
	"/templates/auth/sign-in/",
	"/theme/",
]);

/** A site spec that is not the route harness: it runs itself when it changed. */
const ownSpec = (f: string) =>
	/^site\/tests\/[^/]+\.spec\.ts$/.test(f) &&
	!/\/(routes|routes\.axe|dist-html|header)\.spec\.ts$/.test(f);

const land = process.argv.includes("--land");
const git = (...args: string[]) =>
	spawnSync("git", args, { cwd: ROOT, encoding: "utf8" }).stdout.trim().split("\n").filter(Boolean);

const base = process.env.CA_TEST_BASE
	? git("rev-parse", process.env.CA_TEST_BASE)[0]
	: git("merge-base", "HEAD", "origin/main")[0];
if (!base) {
	console.error("test:changed: no base commit (run `git fetch origin main`, or set CA_TEST_BASE)");
	process.exit(2);
}
const changed = [
	...new Set([
		...git("diff", "--name-only", base),
		...git("ls-files", "--others", "--exclude-standard"),
	]),
];
const short = base.slice(0, 8);
if (!changed.length && !land) {
	console.log(`test:changed: no changes against origin/main (${short}), nothing to run`);
	process.exit(0);
}

const sel = select(changed);
const sharedFile = changed.find(isSharedComponent);
const specs = changed.filter(ownSpec);
const routes = sel.all ? [] : [...new Set([...sel.routes, ...(land ? CANARIES : [])])].sort();
const sweepAll = sel.all || (land && sharedFile !== undefined);
const siteRun = sweepAll || routes.length > 0 || specs.length > 0;
const visualRun = sel.all || sel.routes.some((r) => VISUAL_ROUTES.has(r));
const routeRun = sweepAll || routes.length > 0;
// Shared: everything that can reach every test runs, and screenshots are left to `test:vrt`.
const shared = sel.all || sharedFile !== undefined;
if (process.argv.includes("--print-budget")) {
	console.log(land ? landBudget(changed) : "changed");
	process.exit(0);
}

console.log(
	`test:changed${land ? " --land" : ""}: ${changed.length} changed file(s) against ${short}`
);
console.log(`  unit        bun test --changed ${short}`);
const graph = buildGraph();
const pickTests = (candidates: string[]) => [...affected(graph, candidates, changed).keys()];
const compTests = sharedFile ? graph.tests.browser : pickTests(graph.tests.browser);
const ssrTests = sharedFile ? graph.tests.ssr : pickTests(graph.tests.ssr);
const vrtTests = sharedFile ? graph.tests.vrt : pickTests(graph.tests.vrt);
console.log(
	sharedFile
		? `  components  ALL ${compTests.length}: ${sharedFile} is shared by every component test`
		: `  components  ${compTests.length} of ${graph.tests.browser.length} test files reach a changed file`
);
console.log(
	shared
		? "  visual      none: a shared change runs every screenshot at release (bun run test:vrt)"
		: `  visual      ${vrtTests.length} of ${graph.tests.vrt.length} component screenshot files${visualRun ? "; site: landing, templates, theme" : ""}`
);
if (sel.all) console.log(`  routes      ALL: ${sel.reason}`);
else if (sweepAll)
	console.log(`  routes      ALL: ${sharedFile} is shared by every component test`);
else if (routes.length) {
	console.log(
		`  routes      ${routes.length}${land ? ` (incl. ${CANARIES.length} canaries)` : ""}:`
	);
	for (const r of routes.slice(0, 10))
		console.log(`                ${r}  <- ${sel.why.get(r) ?? "canary"}`);
	if (routes.length > 10) console.log(`                … ${routes.length - 10} more`);
} else console.log("  routes      none: no changed file reaches a docs route");
if (specs.length)
	console.log(`  specs       ${specs.map((f) => f.replace("site/tests/", "")).join(" ")}`);

const run = (cmd: string[], env: Record<string, string> = {}, cwd = ROOT) =>
	spawnSync(process.execPath, [join(ROOT, "scripts/test-run.ts"), ...cmd], {
		cwd,
		stdio: "inherit",
		env: { ...process.env, ...env },
	}).status ?? 1;

const failed: string[] = [];
let lap = performance.now();
const step = (name: string, code: number) => {
	const seconds = ((performance.now() - lap) / 1000).toFixed(1);
	console.log(`test:changed: ${name} ${code === 0 ? "ok" : "FAILED"} (${seconds}s)`);
	lap = performance.now();
	if (code !== 0) failed.push(name);
};

// Unit tests: only the files the diff reaches. `bun test` exits 1 when nothing matched, which is not a failure here.
const unit = run(["bun", "test", `--changed=${base}`]);
step("unit", unit === 1 && !changed.some((f) => /\.(ts|js|svelte)$/.test(f)) ? 0 : unit);

const vitestExtra = process.argv.slice(2).filter((a) => a !== "--" && a !== "--land");
const inPkg = (files: string[]) => files.map((f) => f.replace("packages/ui/", ""));
const pkgDir = join(ROOT, "packages/ui");
if (compTests.length || ssrTests.length)
	step(
		"components",
		run(
			[
				"vitest",
				"run",
				...(compTests.length ? ["--project", "browser"] : []),
				...(ssrTests.length ? ["--project", "ssr"] : []),
				...(sharedFile ? [] : inPkg([...compTests, ...ssrTests])),
				...vitestExtra,
			],
			{},
			pkgDir
		)
	);

// Screenshots of the changed components only (the platform's own baselines, rendered natively).
if (!shared && vrtTests.length)
	step(
		"visual (components)",
		run(
			[
				"vitest",
				"run",
				"--project",
				"vrt",
				"--maxWorkers=2",
				...(sharedFile ? [] : inPkg(vrtTests)),
			],
			{},
			pkgDir
		)
	);

if (siteRun) {
	// The route specs read `site/dist`: rebuild only what is older than the diff.
	const mtime = (p: string) => (existsSync(p) ? statSync(p).mtimeMs : 0);
	const pkgDist = mtime(join(ROOT, "packages/ui/dist/index.js"));
	const siteDist = mtime(join(ROOT, "site/dist/index.html"));
	const newer = (re: RegExp, than: number) =>
		changed.some((f) => re.test(f) && mtime(join(ROOT, f)) > than);
	const pkgStale = !pkgDist || newer(/^packages\/ui\/(src|scripts|package\.json)/, pkgDist);
	const siteStale =
		!siteDist ||
		pkgStale ||
		newer(/^site\/(src|public|astro\.config\.mjs|package\.json)/, siteDist);
	// A build is ~75 s (package 17 s + site 58 s), more than the whole 60 s dev budget: only the land gate
	// builds. A dev run uses `site/dist` when it is fresh, and says so when it cannot.
	if ((pkgStale || siteStale) && !land) {
		console.log(
			"test:changed: site SKIPPED: site/dist is older than the diff. Run `bun run build` once and repeat, or let the land gate (`issue-land.sh`) run it."
		);
		process.exit(failed.length ? 1 : 0);
	}
	if (pkgStale) step("build package", run(["bun", "run", "--cwd", "packages/ui", "build"]));
	if (siteStale) step("build site", run(["bun", "run", "--cwd", "site", "build"]));

	const env = {
		E2E_PREBUILT: "1",
		...(routeRun && !sweepAll ? { E2E_ROUTES: JSON.stringify(routes) } : {}),
	};
	const args = [
		"playwright",
		"test",
		...(routeRun
			? [
					"--project=desktop",
					"--project=mobile",
					"--project=axe",
					"routes.spec",
					"routes.axe",
					"dist-html",
				]
			: ["--project=desktop", "--project=mobile"]),
		...specs.map((f) => f.replace("site/tests/", "")),
	];
	step("site", run(args, env, join(ROOT, "site")));
	if (!shared && visualRun)
		step(
			"visual (site)",
			run(
				["playwright", "test", "--project=visual-desktop", "--project=visual-mobile"],
				{ E2E_PREBUILT: "1" },
				join(ROOT, "site")
			)
		);
}
process.exit(failed.length ? 1 : 0);
