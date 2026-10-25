import { describe, expect, it } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { evict, footprint, type Store } from "../../../scripts/caches";

// Every cache the tooling writes has a hard size cap and an age limit, and the leftovers of other tools
// (Playwright leaves one empty directory per browser launch in $TMPDIR, ~14 per run) are reaped, so running the
// suite twice never grows the disk. The audit that motivated it: 2,059 orphaned tracing directories, a 366 MB
// reporter file nothing wrote any more, an OG card cache with no size cap.
const scratch = () => mkdtempSync(join(tmpdir(), "ca-caches-test-"));
const old = (path: string, hoursAgo: number) => {
	const t = new Date(Date.now() - hoursAgo * 3_600_000);
	utimesSync(path, t, t);
};
const file = (dir: string, name: string, bytes: number, hoursAgo = 0) => {
	const path = join(dir, name);
	writeFileSync(path, Buffer.alloc(bytes));
	old(path, hoursAgo);
	return path;
};

describe("evict by age", () => {
	it("removes entries older than maxAgeHours and keeps newer ones", () => {
		const dir = scratch();
		const stale = file(dir, "a.png", 10, 48);
		const fresh = file(dir, "b.png", 10, 1);
		const store: Store = { name: "t", dir, maxAgeHours: 24, maxBytes: 1_000_000 };
		expect(evict(store).removed).toBe(1);
		expect(existsSync(stale)).toBe(false);
		expect(existsSync(fresh)).toBe(true);
		rmSync(dir, { recursive: true });
	});
});

describe("evict by size", () => {
	it("drops the least recently used entries until the cap holds", () => {
		const dir = scratch();
		const oldest = file(dir, "1", 400, 3);
		const middle = file(dir, "2", 400, 2);
		const newest = file(dir, "3", 400, 1);
		evict({ name: "t", dir, maxAgeHours: 1000, maxBytes: 900 });
		expect(existsSync(oldest)).toBe(false);
		expect(existsSync(middle)).toBe(true);
		expect(existsSync(newest)).toBe(true);
		expect(footprint(dir)).toBeLessThanOrEqual(900);
		rmSync(dir, { recursive: true });
	});
});

describe("evict only touches what a store owns", () => {
	it("matches by prefix, so another tool's files in the same directory stay", () => {
		const dir = scratch();
		const ours = file(dir, "playwright-tracing-abc", 0, 5);
		const theirs = file(dir, "someone-elses-file", 10, 5);
		evict({ name: "t", dir, prefix: "playwright-tracing-", maxAgeHours: 1, maxBytes: 1_000_000 });
		expect(existsSync(ours)).toBe(false);
		expect(existsSync(theirs)).toBe(true);
		rmSync(dir, { recursive: true });
	});

	it("removes empty directories (a launch's leftover) and non-empty ones the same way", () => {
		const dir = scratch();
		mkdirSync(join(dir, "pw-1"));
		mkdirSync(join(dir, "pw-2"));
		writeFileSync(join(dir, "pw-2", "x"), "x");
		old(join(dir, "pw-1"), 5);
		old(join(dir, "pw-2"), 5);
		expect(
			evict({ name: "t", dir, prefix: "pw-", maxAgeHours: 1, maxBytes: 1_000_000 }).removed
		).toBe(2);
		rmSync(dir, { recursive: true });
	});

	it("a missing directory is nothing to do", () => {
		expect(
			evict({ name: "t", dir: join(tmpdir(), "ca-nope-nope"), maxAgeHours: 1, maxBytes: 1 }).removed
		).toBe(0);
	});
});

describe("the footprint does not grow across runs", () => {
	it("a second run over the same store frees what the first left and never adds", () => {
		const dir = scratch();
		const store: Store = { name: "t", dir, prefix: "run-", maxAgeHours: 1, maxBytes: 500 };
		const run = (n: number) => {
			// a run leaves five directories with one 200-byte artifact each, as a test run does
			for (let i = 0; i < 5; i++) {
				mkdirSync(join(dir, `run-${n}-${i}`));
				writeFileSync(join(dir, `run-${n}-${i}`, "trace.zip"), Buffer.alloc(200));
			}
			evict(store);
			return footprint(dir);
		};
		const first = run(1);
		const second = run(2);
		expect(first).toBeLessThanOrEqual(500);
		expect(second).toBeLessThanOrEqual(first);
		rmSync(dir, { recursive: true });
	});
});
