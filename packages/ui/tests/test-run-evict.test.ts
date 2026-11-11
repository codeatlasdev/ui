import { afterAll, describe, expect, it } from "bun:test";
import { existsSync, mkdirSync, utimesSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cleanTmp, tmpDir } from "./tmp";

// #873: a run without the lock (`validate` runs with CA_TEST_LOCK=0) must not evict the caches: the browser run that
// holds the lock is using them, and losing its playwright-artifacts-* mid-run failed dozens of unrelated files.
const SCRIPT = join(import.meta.dir, "../../../scripts/test-run.ts");
afterAll(cleanTmp);

const { CA_TEST_LOCK_HELD, CA_TEST_TIMINGS, CA_TEST_RUN, CA_TEST_LOCK, ...inherited } = process.env;

describe("test-run without the lock", () => {
	it("leaves the caches of the run that holds the lock alone", () => {
		const tmp = tmpDir("ca-evict-");
		const artifacts = join(tmp, "playwright-artifacts-inuse");
		mkdirSync(artifacts);
		writeFileSync(join(artifacts, "trace.jsonl"), "x");
		// Two hours old: past the store's one-hour age limit, so an eviction would remove it.
		const old = Date.now() / 1000 - 7200;
		utimesSync(artifacts, old, old);
		const run = Bun.spawnSync([process.execPath, SCRIPT, "true"], {
			env: {
				...inherited,
				CA_TEST_LOCK: "0",
				TMPDIR: tmp,
				CA_TEST_LOCK_DIR: join(tmp, "lock"),
				CA_TEST_HISTORY: join(tmp, "history.jsonl"),
			},
		});
		expect(run.exitCode).toBe(0);
		expect(existsSync(artifacts)).toBe(true);
	});
});

// #946: the lock tests start real runs that take a lock of their own (CA_TEST_LOCK_DIR). Holding that lock, they
// evicted the machine's caches, deleting the playwright-artifacts dir of a browser run in progress elsewhere: 131
// to 1513 component tests then failed with `tracing.stopChunk: ENOENT`. Only the machine-wide lock may evict.
describe("test-run with a lock of its own", () => {
	it("leaves the machine's caches alone", () => {
		const tmp = tmpDir("ca-evict-");
		const artifacts = join(tmp, "playwright-artifacts-inuse");
		mkdirSync(artifacts);
		writeFileSync(join(artifacts, "trace.jsonl"), "x");
		const old = Date.now() / 1000 - 7200;
		utimesSync(artifacts, old, old);
		const run = Bun.spawnSync([process.execPath, SCRIPT, "true"], {
			env: {
				...inherited,
				TMPDIR: tmp,
				CA_TEST_LOCK_DIR: join(tmp, "a-test-lock"),
				CA_TEST_HISTORY: join(tmp, "history.jsonl"),
			},
		});
		expect(run.exitCode).toBe(0);
		expect(existsSync(artifacts)).toBe(true);
	});
});
