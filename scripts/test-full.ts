/**
 * `bun run test:full`: the release gate, part 1 of 2 (part 2 is `test:vrt`). Run under `--budget=full`.
 *
 *   1. package build        the unit tests that read `packages/ui/dist` and the site build both need it. A gate that
 *                           served a site built from an OLD `dist` tested the previous release (#610: the map
 *                           failed on a `dist` older than `src`), so the build is part of the run, never trusted.
 *   2. site build           runs beside the unit and component tests (it is mostly one busy core; the component
 *                           tests render from `src`).
 *   3. fixtures             builds real Astro/Kit apps from the package `dist`.
 *
 * The site specs are two more commands of their own, each with its own budget, so none reaches five minutes:
 * `test:e2e` (behaviour specs and the zero-browser HTML checks of every page) and `test:routes` (the page sweep:
 * layout and axe on every page but the gallery items and atlas terms, which stand for their template through
 * representatives, `E2E_SWEEP=templates`, site/tests/routes.ts). Both read the `site/dist` this run built, so they
 * follow it in `scripts/release.ts`, which stops at the first red command.
 *
 * Every step prints its own wall time; the run fails after the parallel one has finished.
 */
import { spawn, spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const testRun = (cmd: string[]) => [join(ROOT, "scripts/test-run.ts"), ...cmd];
const env = { ...process.env, E2E_PREBUILT: "1" };
const run = (cmd: string[], cwd = ROOT) =>
	spawnSync(process.execPath, testRun(cmd), { cwd, stdio: "inherit", env }).status ?? 1;
const runAsync = (cmd: string[], cwd = ROOT) => {
	const { promise, resolve } = Promise.withResolvers<number>();
	const child = spawn(process.execPath, testRun(cmd), { cwd, stdio: "inherit", env });
	child.on("exit", (code, signal) => resolve(code ?? (signal ? 1 : 0)));
	child.on("error", () => resolve(127));
	return promise;
};

const failed: string[] = [];
const step = async (name: string, work: () => number | Promise<number>, note = "") => {
	const t0 = performance.now();
	const code = await work();
	console.log(
		`test:full: ${name} ${code === 0 ? "ok" : "FAILED"} (${((performance.now() - t0) / 1000).toFixed(1)}s${note})`
	);
	if (code !== 0) failed.push(name);
};

await step("build package", () => run(["bun", "run", "--cwd", "packages/ui", "build"]));
if (failed.length) process.exit(1);

const building = step(
	"build site",
	() => runAsync(["bun", "run", "--cwd", "site", "build"]),
	", beside the tests"
);
await step("unit", () => run(["bun", "run", "test:unit"]));
await step("components", () => run(["bun", "run", "test:browser"]));
await building;
// The sweeps below read `site/dist`: never run them on a build that failed.
if (failed.includes("build site")) process.exit(1);

await step("fixtures", () => run(["bun", "run", "test:fixtures"]));

process.exit(failed.length ? 1 : 0);
