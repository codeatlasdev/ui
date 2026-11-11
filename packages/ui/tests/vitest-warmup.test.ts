import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import config, { NODE_ONLY_PEERS } from "../vite.config.ts";

const ROOT = join(import.meta.dir, "..");

/**
 * #640: `TypeError: Failed to fetch dynamically imported module` on `tests/setup.browser.ts` (and, in
 * the release run, on PhoneField.svelte.test.ts) while the site build ran beside the components. Every
 * browser page imports the setup files first, all pages at once, against a Vite server that has not
 * transformed anything yet; measured on a starved machine, that first burst of requests took 1.5 to 7 s,
 * and one of them failed the import (1 in 11 starved cold runs). The files every page needs are
 * transformed when the server starts, so the first page never waits on a cold transform.
 */
describe("the browser Vite server warms up what every page imports (#640)", () => {
	type Project = { test?: { name?: string; setupFiles?: string[]; browser?: unknown } };
	const projects = ((config.test?.projects ?? []) as Project[]).filter((p) => p.test?.browser);
	const warmup = new Set((config.server?.warmup?.clientFiles ?? []).map((f) => resolve(ROOT, f)));

	it("lists every setup file of every browser project", () => {
		expect(projects.length).toBeGreaterThan(0);
		for (const p of projects)
			for (const f of p.test?.setupFiles ?? [])
				expect(warmup.has(resolve(ROOT, f)), `${p.test?.name}: ${f} is not warmed up`).toBe(true);
	});

	it("lists only files that exist", () => {
		for (const f of warmup) expect(existsSync(f), `${f} does not exist`).toBe(true);
	});

	it("warms the global stylesheet the setup imports", () => {
		expect(warmup.has(resolve(ROOT, "src/lib/styles/global.css"))).toBe(true);
	});
});

/**
 * #959: a dependency Vite discovers in the middle of a run is optimised and the page reloads, which breaks every
 * import in flight: 213 to 1513 component tests failed in three land gates (`@floating-ui/dom`, `@lucide/svelte`,
 * `@deck.gl/mapbox`, `maplibre-gl` were not pre-bundled). Every package a browser test can reach is pre-bundled.
 */
describe("the browser Vite server pre-bundles every runtime dependency (#959)", () => {
	const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
		dependencies?: Record<string, string>;
		peerDependencies?: Record<string, string>;
	};
	const include = new Set(config.optimizeDeps?.include ?? []);

	it("includes every dependency and browser-side peer of the package", () => {
		const reachable = [
			...Object.keys(pkg.dependencies ?? {}),
			...Object.keys(pkg.peerDependencies ?? {}),
		].filter(
			(d) =>
				!NODE_ONLY_PEERS.includes(d) && existsSync(join(ROOT, "node_modules", d, "package.json"))
		);
		expect(reachable).toContain("@floating-ui/dom");
		for (const d of reachable)
			expect(include.has(d), `${d} is not in optimizeDeps.include`).toBe(true);
	});
});
