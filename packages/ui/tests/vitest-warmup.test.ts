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

	// Vite pre-bundles each imported subpath as its own entry: `echarts` in the list did not cover
	// `echarts/core`, so the first chart test re-optimised and reloaded every page mid-run (#1007).
	it("includes every subpath of a dependency that the package source imports", () => {
		const deps = Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies }).filter(
			(d) => !NODE_ONLY_PEERS.includes(d)
		);
		const specifiers = new Set<string>();
		for (const file of new Bun.Glob("src/lib/**/*.{ts,svelte}").scanSync(ROOT)) {
			if (/\.(test|vrt\.test|ssr\.test)\.ts$|\.test\.svelte$/.test(file)) continue;
			for (const m of readFileSync(join(ROOT, file), "utf8").matchAll(
				/from\s+["']([^"'.][^"']*)["']/g
			))
				if (deps.some((d) => m[1].startsWith(`${d}/`))) specifiers.add(m[1]);
		}
		expect(specifiers.has("echarts/core")).toBe(true);
		for (const s of specifiers)
			expect(include.has(s), `${s} is not in optimizeDeps.include`).toBe(true);
	});

	// A package only the tests import (a devDependency) was discovered mid-run too: @deck.gl/layers,
	// imported by MapStageDeck's test, reloaded every page of a land gate (#1030).
	it("includes every installed package the browser tests import", () => {
		const dev = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")).devDependencies ?? {};
		const runner =
			/^(vitest|@vitest\/|vitest-browser-|svelte$|svelte\/|@sveltejs\/|playwright|@playwright\/)/;
		const used = new Set<string>();
		for (const file of new Bun.Glob("src/lib/**/*.{svelte.test.ts,test.svelte}").scanSync(ROOT))
			for (const m of readFileSync(join(ROOT, file), "utf8").matchAll(
				/from\s+["']([^"'.][^"']*)["']/g
			)) {
				const name = m[1].startsWith("@")
					? m[1].split("/").slice(0, 2).join("/")
					: m[1].split("/")[0];
				if (name in dev && !runner.test(m[1]) && !m[1].includes("?")) used.add(m[1]);
			}
		expect(used.has("@deck.gl/layers")).toBe(true);
		for (const s of used) expect(include.has(s), `${s} is not in optimizeDeps.include`).toBe(true);
	});
});
