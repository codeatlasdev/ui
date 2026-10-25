#!/usr/bin/env bun
/**
 * Everything our tooling writes outside the source tree, with a hard size cap and an age limit each, in ONE table.
 *
 *   bun scripts/caches.ts            show the size of every store and what an eviction would free (`clean:caches`)
 *   bun scripts/caches.ts --clean    evict now
 *
 * `evict` also runs at the start of every `scripts/test-run.ts` run, so a store never outgrows its cap between two
 * manual cleanups. Eviction is by age first, then least-recently-used until the cap holds; a store with a `prefix`
 * only ever touches entries of that name, so another tool's files in the same directory are safe.
 *
 * Why this exists (audit, 2026-10-25): `$TMPDIR` held 2,059 orphaned `playwright-tracing-*` directories (Playwright
 * leaves one per browser launch, about 14 per test run), the OG card cache had an age limit but no size cap, and a
 * 366 MB reporter file in `.cache` was written by nothing any more.
 */
import { existsSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface Store {
	name: string;
	dir: string;
	/** Only entries whose name starts with this belong to the store (default: all of them). */
	prefix?: string;
	/** Only entries whose name matches belong to the store (a cache of `<sha256>.png` leaves any other file alone). */
	match?: RegExp;
	maxAgeHours: number;
	maxBytes: number;
	/** Artifacts of the last run only: a top-level run empties the store before it starts (`evictAll(false, true)`). */
	lastRunOnly?: boolean;
}

const MB = 1024 * 1024;
const root = join(import.meta.dir, "..");
const tmp = process.env.TMPDIR ? process.env.TMPDIR : tmpdir();

/** The one table. Raise a cap only with the measured reason. */
export const STORES: Store[] = [
	// Social cards (site/scripts/og-integration.ts): ~920 PNGs, 119 MB today; a template change replaces them all.
	{
		name: "og cards",
		dir: process.env.CA_OG_CACHE_DIR ?? join(tmp, "ca-og-cards"),
		match: /^[0-9a-f]{64}\.png$/,
		maxAgeHours: 30 * 24,
		maxBytes: 256 * MB,
	},
	// Playwright's per-launch directories: empty or a few KB, never removed by Playwright itself.
	{
		name: "playwright tracing",
		dir: tmp,
		prefix: "playwright-tracing-",
		maxAgeHours: 1,
		maxBytes: 1 * MB,
	},
	{
		name: "playwright artifacts",
		dir: tmp,
		prefix: "playwright-artifacts-",
		maxAgeHours: 1,
		maxBytes: 64 * MB,
	},
	{
		name: "chromium profiles",
		dir: tmp,
		prefix: "playwright_chromiumdev_profile-",
		maxAgeHours: 1,
		maxBytes: 64 * MB,
	},
	{
		name: "webkit profiles",
		dir: tmp,
		prefix: "playwright_webkitdev_profile-",
		maxAgeHours: 1,
		maxBytes: 64 * MB,
	},
	// One timings file per top-level run (scripts/test-run.ts removes its own; a killed run leaves it).
	{ name: "run timings", dir: tmp, prefix: "ca-timings-", maxAgeHours: 24, maxBytes: 8 * MB },
	// Test artifacts of the LAST run only: reports, traces and attachments of an older run explain nothing.
	{
		name: "vitest report",
		lastRunOnly: true,
		dir: join(root, "packages/ui/.vitest"),
		maxAgeHours: 24,
		maxBytes: 64 * MB,
	},
	{
		name: "playwright report",
		lastRunOnly: true,
		dir: join(root, "site/playwright-report"),
		maxAgeHours: 24,
		maxBytes: 64 * MB,
	},
	{
		name: "playwright results",
		lastRunOnly: true,
		dir: join(root, "site/test-results"),
		maxAgeHours: 24,
		maxBytes: 128 * MB,
	},
	{ name: "run records", dir: join(root, ".cache/test-runs"), maxAgeHours: 24, maxBytes: 1 * MB },
];

/** Bytes under `path` (a file counts as itself). */
export function footprint(path: string): number {
	if (!existsSync(path)) return 0;
	const s = statSync(path);
	if (!s.isDirectory()) return s.size;
	return readdirSync(path).reduce((sum, name) => sum + footprint(join(path, name)), 0);
}

interface Entry {
	path: string;
	bytes: number;
	used: number;
}

function entriesOf(store: Store): Entry[] {
	if (!existsSync(store.dir)) return [];
	return readdirSync(store.dir)
		.filter((name) => !store.prefix || name.startsWith(store.prefix))
		.filter((name) => !store.match || store.match.test(name))
		.map((name) => {
			const path = join(store.dir, name);
			return { path, bytes: footprint(path), used: statSync(path).mtimeMs };
		});
}

/** Removes what is past the age limit, then the least recently used until the cap holds. */
export function evict(store: Store, dryRun = false): { removed: number; freed: number } {
	const entries = entriesOf(store).sort((a, b) => a.used - b.used);
	const limit = Date.now() - store.maxAgeHours * 3_600_000;
	let total = entries.reduce((sum, e) => sum + e.bytes, 0);
	let removed = 0;
	let freed = 0;
	for (const e of entries) {
		if (e.used >= limit && total <= store.maxBytes) continue;
		if (!dryRun) rmSync(e.path, { recursive: true, force: true });
		total -= e.bytes;
		freed += e.bytes;
		removed += 1;
	}
	return { removed, freed };
}

/**
 * Evicts every store; returns the totals. `newRun` (a top-level test run, not one nested in it) also empties the
 * stores that keep the last run's artifacts only.
 */
export function evictAll(dryRun = false, newRun = false): { removed: number; freed: number } {
	return STORES.map((s) =>
		evict(newRun && s.lastRunOnly ? { ...s, maxAgeHours: 0 } : s, dryRun)
	).reduce((a, b) => ({ removed: a.removed + b.removed, freed: a.freed + b.freed }), {
		removed: 0,
		freed: 0,
	});
}

if (import.meta.main) {
	const clean = process.argv.includes("--clean");
	const mb = (n: number) => `${(n / MB).toFixed(1)} MB`;
	for (const s of STORES) {
		const size = entriesOf(s).reduce((sum, e) => sum + e.bytes, 0);
		const count = entriesOf(s).length;
		const { removed, freed } = evict(s, !clean);
		console.log(
			`${s.name.padEnd(20)} ${String(count).padStart(5)} entries ${mb(size).padStart(9)}  cap ${mb(s.maxBytes)}, ${s.maxAgeHours} h  ${clean ? "freed" : "would free"} ${removed} (${mb(freed)})`
		);
	}
	if (!clean) console.log("\nbun run clean:caches -- --clean   to free it");
}
