#!/usr/bin/env bun
/**
 * `bun run test` / `bun run test:changed`: run what the diff against origin/main affects, say what was
 * selected and why, and stay inside the `changed` time budget (scripts/test-run.ts). `--land` is the
 * same selection plus the route canaries, the gate `issue-land.sh` runs. `bun run test:full`, `test:e2e`
 * and `test:routes` run the whole suite and `bun run test:vrt` every screenshot; all four run at release.
 *
 * A SHARED change (a shared component file, or a route-wide one: styles, tokens, theme, primitives, the
 * site layout, a test setup file, or a file the route map cannot place) runs every component test and, when
 * it reaches the site, every route, and NO screenshots: those run at release (`test:vrt`) and on demand.
 * `--print-budget` prints the budget this selection runs under: `changed` (60 s) for a narrow dev run, `land`
 * (180 s) for a narrow land run, `landShared` (240 s) for either when the selection widens to every component
 * test (a shared file or a test-runtime dependency such as happy-dom); the run then prints
 * "widened to all components because <file>".
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
 *               specs run themselves. A dev run needs `site/dist` to be fresh (a build is ~80 s, over
 *               the 60 s budget) and says so when it is not; `--land` builds and adds the canaries below.
 *
 * `CA_TEST_BASE=<ref>` compares against another ref (`CA_TEST_BASE=HEAD`: only what is not committed yet).
 *
 * Steps run under scripts/test-run.ts (machine-wide lock, 25% browser cap). At land the site build runs
 * beside the unit and component tests (after the package build, which the unit tests read); everything
 * else is sequential, and the screenshots and the route sweep never share the machine with another run.
 * Extra args go to Vitest: `bun run test:changed -- --reporter=minimal`.
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { distCovers, distStale, readScope } from "./dist-fresh.ts";
import { lockReachesRuntime, ownRoutes, ROOT, select, VISUAL_ROUTES } from "./route-impact.ts";
import {
	affected,
	buildGraph,
	isSharedComponent,
	resolveBudget,
	widenedBecause,
} from "./test-graph.ts";
import { BUDGETS } from "./test-run.ts";

if (!import.meta.main) throw new Error("scripts/test-changed.ts is a command, not a module");

/** One page per layout family, always retested at land: home, the biggest docs page, the app shell, an app template, the theme editor. */
const CANARIES = [
	"/",
	"/docs/getting-started/recipes/",
	"/docs/layout/app-shell/",
	"/templates/app/dashboard/",
	"/theme/",
];

/**
 * A site spec that is not the route harness: it runs itself when it changed. `no-flash.spec.ts` is not one of
 * them: it paints real pages at 6x CPU on Slow 3G (~90 s for its cases), so it runs in `test:e2e` at release.
 * What guards the same guarantee at land is `packages/ui/tests/theme-order.test.ts`, a unit test (2 s) that
 * reads the built HTML and fails when a theme script comes after a stylesheet.
 */
const ownSpec = (f: string) =>
	/^site\/tests\/[^/]+\.spec\.ts$/.test(f) &&
	!/\/(routes|routes\.axe|dist-html|header|no-flash)\.spec\.ts$/.test(f);

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
// A lockfile change that only touches a workspace's devDependencies cannot change a page or a component:
// it does not widen the run to every route and every component test (route-impact `lockReachesRuntime`).
const lockIsDevOnly = () => {
	const before = spawnSync("git", ["show", `${base}:bun.lock`], { cwd: ROOT, encoding: "utf8" });
	return (
		before.status === 0 &&
		!lockReachesRuntime(before.stdout, readFileSync(join(ROOT, "bun.lock"), "utf8"))
	);
};
const changed = [
	...new Set([
		...git("diff", "--name-only", base),
		...git("ls-files", "--others", "--exclude-standard"),
	]),
].filter((f) => f !== "bun.lock" || !lockIsDevOnly());
const short = base.slice(0, 8);
// The budget follows the selection's scope (scripts/test-graph.ts `resolveBudget`): scripts/test-changed.sh and
// `issue-land.sh` read it from here before the clock starts.
const budget = resolveBudget(changed, land);
if (process.argv.includes("--print-budget")) {
	console.log(budget);
	process.exit(0);
}
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
const visualRun = sel.all || sel.routes.some((r) => VISUAL_ROUTES.includes(r));
const routeRun = sweepAll || routes.length > 0;
// A narrow site run builds only the pages it audits (`CA_SITE_ROUTES`, site/src/lib/only-routes.ts): a behaviour spec
// visits arbitrary pages and a sweep audits all of them, so those need the whole site. 915 pages are ~80 s of the
// page generation, 80 pages ~11 s.
const builtRoutes: string[] | undefined =
	!sweepAll && specs.length === 0
		? [...new Set([...routes, ...(visualRun ? VISUAL_ROUTES : [])])].sort()
		: undefined;
// Shared: everything that can reach every test runs, and screenshots are left to `test:vrt`.
const shared = sel.all || sharedFile !== undefined;
const widened = widenedBecause(changed);
if (widened !== undefined)
	console.log(
		`test:changed: widened to all components because ${widened}, so the ${budget} budget applies (${BUDGETS[budget]} s)`
	);

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

const runEnv = (env: Record<string, string>) => ({ ...process.env, ...env });
const testRun = (cmd: string[]) => [join(ROOT, "scripts/test-run.ts"), ...cmd];
const run = (cmd: string[], env: Record<string, string> = {}, cwd = ROOT) =>
	spawnSync(process.execPath, testRun(cmd), { cwd, stdio: "inherit", env: runEnv(env) }).status ??
	1;
/** The same as `run`, without blocking: the land gate builds the site while the package tests run. */
const runAsync = (cmd: string[], env: Record<string, string> = {}, cwd = ROOT) => {
	const { promise, resolve } = Promise.withResolvers<number>();
	const child = spawn(process.execPath, testRun(cmd), { cwd, stdio: "inherit", env: runEnv(env) });
	child.on("exit", (code, signal) => resolve(code ?? (signal ? 1 : 0)));
	child.on("error", () => resolve(127));
	return promise;
};

const failed: string[] = [];
/** Runs one step and reports its own wall time; steps can overlap, so there is no shared lap clock. */
const step = async (name: string, work: () => number | Promise<number>, note = "") => {
	const t0 = performance.now();
	const code = await work();
	const seconds = ((performance.now() - t0) / 1000).toFixed(1);
	console.log(`test:changed: ${name} ${code === 0 ? "ok" : "FAILED"} (${seconds}s${note})`);
	if (code !== 0) failed.push(name);
};

const vitestExtra = process.argv.slice(2).filter((a) => a !== "--" && a !== "--land");
const inPkg = (files: string[]) => files.map((f) => f.replace("packages/ui/", ""));
const pkgDir = join(ROOT, "packages/ui");

/** Unit tests (only the files the diff reaches), then the component tests. */
const packageTests = async () => {
	await step("unit", () => {
		// `bun test` exits 1 when nothing matched, which is not a failure here.
		const unit = run(["bun", "test", `--changed=${base}`]);
		return unit === 1 && !changed.some((f) => /\.(ts|js|svelte)$/.test(f)) ? 0 : unit;
	});
	if (compTests.length || ssrTests.length)
		await step("components", () =>
			runAsync(
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
};

// What the site tests need built. The route specs read `site/dist`: rebuild only what is older than the diff.
const mtime = (p: string) => (existsSync(p) ? statSync(p).mtimeMs : 0);
const pkgDist = mtime(join(ROOT, "packages/ui/dist/index.js"));
const siteDist = mtime(join(ROOT, "site/dist/index.html"));
const newer = (re: RegExp, than: number) =>
	changed.some((f) => re.test(f) && mtime(join(ROOT, f)) > than);
const pkgStale =
	siteRun &&
	distStale({
		land,
		exists: pkgDist > 0,
		changedAfter: newer(/^packages\/ui\/(src|scripts|package\.json)/, pkgDist),
	});
const siteStale =
	siteRun &&
	(pkgStale ||
		distStale({
			land,
			exists: siteDist > 0,
			changedAfter: newer(/^site\/(src|public|astro\.config\.mjs|package\.json)/, siteDist),
		}) ||
		// a narrow build (or one of unknown scope) lacks pages this run audits
		!distCovers(readScope(join(ROOT, "site/dist")), builtRoutes));
// A build is ~80 s (package 12 s + site 70 s), more than the whole 60 s dev budget: only the land gate
// builds. A dev run uses `site/dist` when it is fresh, and says so when it cannot.
const buildHere = land && (pkgStale || siteStale);

// The unit tests that read `packages/ui/dist` (the CLIs, the MCP server) need the package built first; the
// component tests render from `src` and the site build reads only the built package. So the package builds
// first, then the site build (mostly one busy core) runs beside the package tests, which hold their own quarter
// of the cores: ~50 s of a land run that used to wait for each in turn.
if (buildHere && pkgStale)
	await step("build package", () => run(["bun", "run", "--cwd", "packages/ui", "build"]));
// Started now, awaited after the package tests: it runs beside them.
const building =
	buildHere && siteStale
		? step(
				"build site",
				() =>
					runAsync(
						["bun", "run", "--cwd", "site", "build"],
						builtRoutes ? { CA_SITE_ROUTES: JSON.stringify(builtRoutes) } : {}
					),
				builtRoutes ? `, ${builtRoutes.length} routes, beside the tests` : ", beside the tests"
			)
		: undefined;
await packageTests();
await building;

if (!shared && vrtTests.length)
	await step("visual (components)", () =>
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

if (!land && (pkgStale || siteStale)) {
	console.log(
		"test:changed: site SKIPPED: site/dist is older than the diff. Run `bun run build` once and repeat, or let the land gate (`issue-land.sh`) run it."
	);
	process.exit(failed.length ? 1 : 0);
}

if (siteRun) {
	const env = {
		E2E_PREBUILT: "1",
		...(routeRun && !sweepAll ? { E2E_ROUTES: JSON.stringify(routes) } : {}),
		// A full sweep at land audits the gallery, the atlas and the docs through representatives (plus the pages the
		// diff itself changed); the release sweep (`test:routes`) thins only items and terms.
		...(land && sweepAll
			? { E2E_GALLERY: "representatives", E2E_KEEP: JSON.stringify(ownRoutes(changed)) }
			: {}),
	};
	const args = [
		"playwright",
		"test",
		...(routeRun
			? [
					"--project=routes-desktop",
					"--project=routes-mobile",
					"--project=axe",
					"--project=static",
					"routes.spec",
					"routes.axe",
					"dist-html",
				]
			: ["--project=desktop", "--project=mobile", "--project=static"]),
		...specs.map((f) => f.replace("site/tests/", "")),
	];
	await step("site", () => run(args, env, join(ROOT, "site")));
	if (!shared && visualRun)
		await step("visual (site)", () =>
			run(
				["playwright", "test", "--project=visual-desktop", "--project=visual-mobile"],
				{ E2E_PREBUILT: "1" },
				join(ROOT, "site")
			)
		);
}
process.exit(failed.length ? 1 : 0);
