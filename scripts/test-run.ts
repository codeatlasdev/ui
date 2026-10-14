#!/usr/bin/env bun
/**
 * Runs a browser test command so it can never leave browsers behind, and cleans up after runs
 * that were killed hard (SIGKILL, closed terminal, killed agent job).
 *
 *   bun scripts/test-run.ts <command> [args...]   run a test command under a tracked run
 *   bun scripts/test-run.ts --reap                 only clean up dead runs of THIS repo
 *   bun scripts/test-run.ts --status               list live/dead runs and their browsers
 *
 * Ownership is explicit, never guessed: every run gets an id, written to
 * `.cache/test-runs/<id>.json` with the runner's pid, and exported as CA_TEST_RUN. The Vitest and
 * Playwright configs pass it to every browser as `--ca-test-run=<id>`. The reaper only kills
 * processes carrying the id of a run whose runner is gone. Other projects (and other runs of this
 * repo that are still alive) are never touched, even though they share ~/Library/Caches/ms-playwright.
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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
	const rs = records();
	if (!rs.length) return console.log("no recorded test runs");
	for (const r of rs) {
		const state = alive(r.runner) ? "running" : "dead (will be reaped)";
		console.log(
			`${r.id}  ${state}  browsers=${taggedTree(r.id).length}  ${r.cmd.join(" ")}  (${r.cwd})`
		);
	}
}

async function run(cmd: string[]): Promise<number> {
	const reaped = reap();
	if (reaped)
		console.error(`test-run: cleaned ${reaped} browser process(es) left by an interrupted run`);

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
		env: { ...process.env, PATH, CA_TEST_RUN: id },
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
	return code;
}

const args = process.argv.slice(2);
if (args[0] === "--reap") {
	const n = reap();
	console.log(
		n ? `test-run: cleaned ${n} browser process(es) from dead runs` : "test-run: nothing to clean"
	);
} else if (args[0] === "--status") {
	status();
} else if (args.length) {
	process.exit(await run(args));
} else {
	console.error("usage: bun scripts/test-run.ts <command...> | --reap | --status");
	process.exit(2);
}
