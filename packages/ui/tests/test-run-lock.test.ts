import { afterAll, describe, expect, it } from "bun:test";
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cleanTmp, tmpDir } from "./tmp";

// scripts/test-run.ts keeps one suite at a time per machine: a second run waits and says who holds
// the lock instead of starting more browsers on top of the first. These tests drive the real CLI.
const SCRIPT = join(import.meta.dir, "../../../scripts/test-run.ts");
afterAll(cleanTmp);

// Every process a test starts is killed when the file ends, pass or fail: a failed assertion would
// otherwise leave a holder running (its `sh` loop never sees the marker file).
const started: ReturnType<typeof Bun.spawn>[] = [];
afterAll(() => {
	for (const p of started) p.kill();
});

// `bun run validate` runs this suite under test-run.ts itself, which exports the markers of ITS lock and
// timings file, and `CA_TEST_LOCK=0` (validate takes no lock). The CLIs started here must behave like a
// top-level run that locks: inheriting either makes them skip or reuse a lock instead of the one under test.
const { CA_TEST_LOCK, CA_TEST_LOCK_HELD, CA_TEST_TIMINGS, CA_TEST_RUN, ...inherited } = process.env;

const run = (lockDir: string, args: string[]) => {
	const p = Bun.spawn([process.execPath, SCRIPT, ...args], {
		env: {
			...inherited,
			CA_TEST_LOCK_DIR: lockDir,
			CA_TEST_HISTORY: join(lockDir, "..", "history.jsonl"),
		},
		stdout: "pipe",
		stderr: "pipe",
	});
	started.push(p);
	return p;
};

const until = async (what: string, ok: () => boolean, ms = 10_000) => {
	const end = Date.now() + ms;
	while (!ok()) {
		if (Date.now() > end) throw new Error(`timed out waiting for ${what}`);
		await Bun.sleep(25);
	}
};

describe("test-run lock", () => {
	it("a second run waits for the first and names the holder", async () => {
		const dir = join(tmpDir("ca-lock-"), "lock");
		const marker = join(tmpDir("ca-lock-m-"), "go");
		// First run: holds the lock until the marker file appears.
		const first = run(dir, [
			"sh",
			"-c",
			`while [ ! -f ${JSON.stringify(marker)} ]; do sleep 0.05; done`,
		]);
		await until("first run to take the lock", () => existsSync(join(dir, "holder.json")));

		const second = run(dir, ["sh", "-c", "echo second-ran"]);
		// The signal that it is waiting is the message itself: read stderr until it appears.
		let err = "";
		const reader = second.stderr.getReader();
		while (!err.includes("waiting for the test lock held by")) {
			const { value, done } = await reader.read();
			if (done) break;
			err += new TextDecoder().decode(value);
		}
		// Under load this has failed without a trace (#952): the messages carry what the runs printed.
		expect(err, `second run stderr:\n${err}`).toContain(`pid ${first.pid}`);
		expect(second.exitCode, `second run stderr:\n${err}`).toBeNull(); // still waiting

		writeFileSync(marker, "");
		expect(await first.exited).toBe(0);
		expect(await second.exited).toBe(0);
		expect(await new Response(second.stdout).text()).toContain("second-ran");
		expect(existsSync(dir)).toBe(false);
	}, 30_000);

	it("takes over a lock whose holder died", async () => {
		const dir = join(tmpDir("ca-lock-"), "lock");
		// A pid that is gone: spawn and reap a short process.
		const dead = Bun.spawn(["true"]);
		await dead.exited;
		Bun.spawnSync(["mkdir", "-p", dir]);
		writeFileSync(
			join(dir, "holder.json"),
			JSON.stringify({ pid: dead.pid, started: new Date().toISOString(), cwd: "/x", cmd: ["gone"] })
		);
		const p = run(dir, ["sh", "-c", "echo took-over"]);
		const code = await p.exited;
		const [out, err] = [await new Response(p.stdout).text(), await new Response(p.stderr).text()];
		expect(code, `exit ${code}\nstdout:\n${out}\nstderr:\n${err}`).toBe(0);
		expect(out, `stderr:\n${err}`).toContain("took-over");
	}, 20_000);

	it("--status reports the holder, --reap never waits for it", async () => {
		const dir = join(tmpDir("ca-lock-"), "lock");
		const marker = join(tmpDir("ca-lock-m-"), "go");
		const first = run(dir, [
			"sh",
			"-c",
			`while [ ! -f ${JSON.stringify(marker)} ]; do sleep 0.05; done`,
		]);
		await until("first run to take the lock", () => existsSync(join(dir, "holder.json")));

		const status = run(dir, ["--status"]);
		await status.exited;
		const said = await new Response(status.stdout).text();
		const why = `--status stdout:\n${said}\nstderr:\n${await new Response(status.stderr).text()}`;
		expect(said, why).toContain(`test lock: pid ${first.pid}`);
		const reap = run(dir, ["--reap"]);
		expect(await reap.exited).toBe(0);

		writeFileSync(marker, "");
		await first.exited;
	}, 20_000);
});
