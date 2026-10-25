#!/usr/bin/env bun
/**
 * Runs a browser test command so it can never leave browsers behind, and cleans up after runs
 * that were killed hard (SIGKILL, closed terminal, killed agent job).
 *
 *   bun scripts/test-run.ts [--budget=<name>] <command> [args...]   run a test command under a tracked run
 *   bun scripts/test-run.ts --reap                 only clean up dead runs of THIS repo
 *   bun scripts/test-run.ts --status               list live/dead runs and their browsers
 *
 * One suite at a time per machine: a run takes the lock in `$TMPDIR/ca-test-lock` (`CA_TEST_LOCK_DIR` overrides; shared by every
 * worktree and checkout) and a second run waits, printing who holds it, instead of starting more
 * browsers on top of the first. A lock whose holder died is taken over. Set CA_TEST_LOCK=0 to skip
 * (CI runners are single-tenant).
 *
 * Time budgets: `--budget=<name>` gives the command a wall-time budget (BUDGETS below, the one place
 * they live). When it ends, the 10 slowest tests are printed (runners append `{name, ms}` lines to
 * `CA_TEST_TIMINGS`: tests/timing-reporter.ts for Playwright, packages/ui/tests/timing-reporter.ts for
 * Vitest), and a run over its budget FAILS, so slowness is caught like any other regression. The
 * clock starts after the lock is taken: time spent waiting for another suite is not this suite's.
 * A budget is raised only in its own commit, with the measured reason.
 *
 * Ownership is explicit, never guessed: every run gets an id, written to
 * `.cache/test-runs/<id>.json` with the runner's pid, and exported as CA_TEST_RUN. The Vitest and
 * Playwright configs pass it to every browser as `--ca-test-run=<id>`. The reaper only kills
 * processes carrying the id of a run whose runner is gone. Other projects (and other runs of this
 * repo that are still alive) are never touched, even though they share ~/Library/Caches/ms-playwright.
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { availableParallelism, loadavg, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { evictAll } from "./caches.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const runsDir = join(root, ".cache/test-runs");
const TAG = "--ca-test-run=";

interface RunRecord {
	id: string;
	runner: number;
	started: string;
	cwd: string;
	cmd: string[];
}

const alive = (pid: number) => {
	try {
		process.kill(pid, 0);
		return true;
	} catch (e) {
		return (e as NodeJS.ErrnoException).code === "EPERM";
	}
};

/** pid, ppid and full command of every process (one `ps` call). */
function processes(): { pid: number; ppid: number; cmd: string }[] {
	const out = spawnSync("ps", ["-axo", "pid=,ppid=,command="], { encoding: "utf8" }).stdout ?? "";
	return out
		.split("\n")
		.map((l) => l.trim().match(/^(\d+)\s+(\d+)\s+(.*)$/))
		.filter((m): m is RegExpMatchArray => m !== null)
		.map((m) => ({ pid: Number(m[1]), ppid: Number(m[2]), cmd: m[3] }));
}

/** Browser main processes tagged with this run id, plus all their descendants. */
function taggedTree(id: string): number[] {
	const all = processes();
	const roots = all.filter((p) => p.cmd.includes(`${TAG}${id}`)).map((p) => p.pid);
	const out = new Set(roots);
	let grew = true;
	while (grew) {
		grew = false;
		for (const p of all)
			if (out.has(p.ppid) && !out.has(p.pid)) {
				out.add(p.pid);
				grew = true;
			}
	}
	return [...out];
}

function killAll(pids: number[]) {
	for (const pid of pids) {
		try {
			process.kill(pid, "SIGTERM");
		} catch {}
	}
	if (!pids.length) return;
	spawnSync("sleep", ["1"]);
	for (const pid of pids)
		if (alive(pid))
			try {
				process.kill(pid, "SIGKILL");
			} catch {}
}

function records(): RunRecord[] {
	if (!existsSync(runsDir)) return [];
	return readdirSync(runsDir)
		.filter((f) => f.endsWith(".json"))
		.flatMap((f) => {
			try {
				return [JSON.parse(readFileSync(join(runsDir, f), "utf8")) as RunRecord];
			} catch {
				rmSync(join(runsDir, f), { force: true });
				return [];
			}
		});
}

/** Kills the browsers of runs whose runner died, then forgets those runs. Returns killed pids. */
export function reap(): number {
	let killed = 0;
	for (const r of records()) {
		if (alive(r.runner)) continue;
		const pids = taggedTree(r.id);
		killAll(pids);
		killed += pids.length;
		rmSync(join(runsDir, `${r.id}.json`), { force: true });
	}
	return killed;
}

function status() {
	const h = holder();
	console.log(h && alive(h.pid) ? `test lock: ${describeHolder(h)}` : "test lock: free");
	const rs = records();
	if (!rs.length) return console.log("no recorded test runs");
	for (const r of rs) {
		const state = alive(r.runner) ? "running" : "dead (will be reaped)";
		console.log(
			`${r.id}  ${state}  browsers=${taggedTree(r.id).length}  ${r.cmd.join(" ")}  (${r.cwd})`
		);
	}
}

const lockDir = process.env.CA_TEST_LOCK_DIR ?? join(tmpdir(), "ca-test-lock");
const holderFile = join(lockDir, "holder.json");

interface Holder {
	pid: number;
	started: string;
	cwd: string;
	cmd: string[];
}

const holder = (): Holder | undefined => {
	try {
		return JSON.parse(readFileSync(holderFile, "utf8")) as Holder;
	} catch {
		return undefined;
	}
};

const describeHolder = (h: Holder) =>
	`pid ${h.pid}, since ${h.started.slice(11, 19)}Z, ${h.cmd.join(" ")} (${h.cwd})`;

/**
 * Takes the machine-wide lock, waiting while a live run holds it. `mkdir` is the atomic step: it
 * fails when the directory exists. A directory without a live holder (crash between `mkdir` and the
 * holder file, or a dead pid) is taken over.
 */
export async function acquireLock(me: Holder, poll = 2_000): Promise<void> {
	let announced = 0;
	for (;;) {
		try {
			mkdirSync(lockDir);
			writeFileSync(holderFile, JSON.stringify(me));
			return;
		} catch (e) {
			if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
		}
		const h = holder();
		if (h && alive(h.pid)) {
			if (announced !== h.pid) {
				console.error(`test-run: waiting for the test lock held by ${describeHolder(h)}`);
				announced = h.pid;
			}
		} else {
			// Holder gone (or never written): a run that died takes the lock down with it only if it
			// got to clean up, so reclaim it. Re-check right before removing so two waiters do not
			// both delete a lock the first one has just retaken.
			const again = holder();
			if (!again || !alive(again.pid)) rmSync(lockDir, { recursive: true, force: true });
			continue;
		}
		await new Promise((r) => setTimeout(r, poll));
	}
}

export function releaseLock(pid: number) {
	if (holder()?.pid === pid) rmSync(lockDir, { recursive: true, force: true });
}

/** Wall-time budget in seconds of each command. Raise one only in its own commit, with the measured reason. */
export const BUDGETS = {
	/** `bun run test` / `test:changed` with a NARROW selection (one that widens to every component test runs under `landShared`, scripts/test-graph.ts `resolveBudget`) */
	changed: 60,
	/** `bun run validate`: build, types, lint, unit tests, size */
	validate: 90,
	/** `issue-land.sh`: `test:changed --land` (affected tests, changed screenshots, the route canaries) */
	land: 180,
	/**
	 * `issue-land.sh` when a SHARED file changed: every component test, and the route sweep thinned to representatives
	 * (gallery items, atlas terms, the docs pages that still render every component folder; the pages the diff changed
	 * stay), no screenshots. It was 420 s (#596): unit 8 s + components 80 s + package 12 s + site 134 s + routes 148 s =
	 * 382.5 s, which broke the rule that no test command takes 5 minutes. Now the social cards are cached and rendered
	 * four at a time, the site build runs beside the unit and component tests, and the sweep is 649 tests instead of
	 * 1044 (#598). Measured at load 7 on 12 cores, a shared change (components ALL 210 files): 224.8 s with a cold card
	 * cache (package 11 s, then site build 125 s beside the tests, then routes 88 s) and 193.5 s with a warm one (site
	 * build 94 s). The full sweep stays at release (`test:full`). Do not raise it again: make the run faster.
	 * A dev run (`bun run test`) widened to every component test gets it too: the full component set alone is ~80 s
	 * (95 s at load 10.5 on the happy-dom bump #588), over the 60 s `changed` budget that assumed a narrow selection.
	 */
	landShared: 240,
	/** `bun run test:full`: package and site build, unit, every component test, fixtures (release gate, part 1 of 4) */
	full: 300,
	/** `bun run test:e2e`: the site's behaviour specs at both viewports, WebKit, a11y, the zero-browser HTML checks of every page (part 2 of 4) */
	e2e: 300,
	/** `bun run test:routes`: layout and axe on every page, the gallery items and atlas terms through representatives (part 3 of 4) */
	routes: 300,
	/** `bun run test:vrt`: every component and site screenshot (release gate, part 4 of 4) */
	vrt: 180,
} as const;
type BudgetName = keyof typeof BUDGETS;

/** The slowest `n` tests recorded in `file` (JSON lines `{name, ms}` appended by the runners). */
export function slowest(file: string, n = 10): { name: string; ms: number }[] {
	if (!existsSync(file)) return [];
	return readFileSync(file, "utf8")
		.split("\n")
		.flatMap((l) => {
			try {
				return l ? [JSON.parse(l) as { name: string; ms: number }] : [];
			} catch {
				return [];
			}
		})
		.sort((a, b) => b.ms - a.ms)
		.slice(0, n);
}

/**
 * Prints the slowest tests and the budget verdict; returns the exit code the budget adds.
 * A budget is wall time, so on a machine that is oversubscribed (load average above its cores: other
 * suites, builds, other projects) a correct run takes several times longer for no reason in the code, and
 * failing it would make the gate a lottery. The verdict is then printed, with the slowest tests, but does
 * not fail the run: rerun on a quiet machine. `load` is injectable for the unit test.
 */
export function report(
	budget: BudgetName | undefined,
	seconds: number,
	timings: string | undefined,
	load = loadavg()[0],
	cores = availableParallelism()
): number {
	const top = timings ? slowest(timings) : [];
	const over = budget !== undefined && seconds > BUDGETS[budget];
	if (top.length && (over || process.env.CA_TEST_SLOWEST === "1")) {
		console.error("test-run: slowest tests");
		for (const t of top) console.error(`  ${(t.ms / 1000).toFixed(1).padStart(6)}s  ${t.name}`);
	}
	if (budget === undefined) return 0;
	const line = `${budget} ${seconds.toFixed(1)}s of ${BUDGETS[budget]}s (load average ${load.toFixed(1)} on ${cores} cores)`;
	if (!over) {
		console.error(`test-run: within budget: ${line}`);
		return 0;
	}
	if (load > cores) {
		console.error(
			`test-run: OVER BUDGET, NOT ENFORCED: ${line}. The machine is oversubscribed, so this time says nothing about the code: rerun when load is below ${cores}.`
		);
		return 0;
	}
	console.error(
		`test-run: OVER BUDGET: ${line}. A budget is a regression gate: make the run faster, or raise it in its own commit with the measured reason.`
	);
	return 1;
}

async function run(cmd: string[], budget?: BudgetName): Promise<number> {
	const reaped = reap();
	if (reaped)
		console.error(`test-run: cleaned ${reaped} browser process(es) left by an interrupted run`);

	// A nested run (`test:changed` runs vitest and playwright through test-run too) reuses the lock its
	// parent holds instead of waiting for it forever.
	const parent = Number(process.env.CA_TEST_LOCK_HELD);
	const locked = process.env.CA_TEST_LOCK !== "0" && !(parent && alive(parent));
	if (locked)
		await acquireLock({
			pid: process.pid,
			started: new Date().toISOString(),
			cwd: process.cwd(),
			cmd,
		});
	// Holding the lock, nothing else is running: enforce every cache's age limit and size cap (scripts/caches.ts), so a
	// store never outgrows its cap between two cleanups. The run that took the lock also drops the reports, traces and
	// attachments of the previous one; a nested run (`test:changed` calling vitest and playwright) keeps its parent's.
	evictAll(false, locked);

	const t0 = performance.now();
	// One timings file per top-level run; a nested run appends to its parent's.
	const timings = process.env.CA_TEST_TIMINGS ?? join(tmpdir(), `ca-timings-${process.pid}.jsonl`);
	rmSync(process.env.CA_TEST_TIMINGS ? "/nonexistent" : timings, { force: true });

	mkdirSync(runsDir, { recursive: true });
	const id = `${Date.now().toString(36)}-${process.pid}`;
	const record: RunRecord = {
		id,
		runner: process.pid,
		started: new Date().toISOString(),
		cwd: process.cwd(),
		cmd,
	};
	const file = join(runsDir, `${id}.json`);
	writeFileSync(file, JSON.stringify(record));

	// Package binaries (vitest, playwright) resolve like `bun run` does, from the cwd up to the repo root.
	const bins: string[] = [];
	for (let d = process.cwd(); d.startsWith(root); d = dirname(d)) {
		bins.push(join(d, "node_modules/.bin"));
		if (d === root) break;
	}
	const PATH = [...bins, process.env.PATH ?? ""].join(":");

	// Own process group, so a signal or exit tears down the whole test tree (workers, servers).
	const child = spawn(cmd[0], cmd.slice(1), {
		stdio: "inherit",
		detached: true,
		env: {
			...process.env,
			PATH,
			CA_TEST_RUN: id,
			CA_TEST_TIMINGS: timings,
			CA_TEST_LOCK_HELD: String(locked ? process.pid : parent || ""),
		},
	});

	let finished = false;
	const cleanup = () => {
		if (finished) return;
		finished = true;
		try {
			if (child.pid) process.kill(-child.pid, "SIGTERM");
		} catch {}
		killAll(taggedTree(id));
		rmSync(file, { force: true });
		if (locked) releaseLock(process.pid);
	};
	for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"] as const)
		process.on(sig, () => {
			cleanup();
			process.exit(130);
		});

	const code = await new Promise<number>((resolve) => {
		child.on("exit", (c, s) => resolve(c ?? (s ? 1 : 0)));
		// e.g. command not found: report and exit instead of hanging with a stale record.
		child.on("error", (e) => {
			console.error(`test-run: could not start "${cmd[0]}": ${e.message}`);
			resolve(127);
		});
	});
	cleanup();
	const verdict = report(budget, (performance.now() - t0) / 1000, timings);
	if (!process.env.CA_TEST_TIMINGS_KEEP && timings.includes(`ca-timings-${process.pid}`))
		rmSync(timings, { force: true });
	return code || verdict;
}

const args = process.argv.slice(2);
if (!import.meta.main) {
	// imported by tests: no CLI
} else if (args[0] === "--reap") {
	const n = reap();
	console.log(
		n ? `test-run: cleaned ${n} browser process(es) from dead runs` : "test-run: nothing to clean"
	);
} else if (args[0] === "--status") {
	status();
} else if (args.length) {
	const flag = args[0].startsWith("--budget=") ? args.shift() : undefined;
	const name = flag?.slice("--budget=".length) as BudgetName | undefined;
	if (name !== undefined && !(name in BUDGETS)) {
		console.error(`test-run: unknown budget "${name}" (${Object.keys(BUDGETS).join(", ")})`);
		process.exit(2);
	}
	process.exit(await run(args, name));
} else {
	console.error(
		"usage: bun scripts/test-run.ts [--budget=<name>] <command...> | --reap | --status"
	);
	process.exit(2);
}
