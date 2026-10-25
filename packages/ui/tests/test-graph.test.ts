import { describe, expect, it } from "bun:test";
import { affected, buildGraph, isSharedComponent, landBudget } from "../../../scripts/test-graph";

// scripts/test-graph.ts selects component tests by a static import graph, because Vitest's `--changed`
// selects every file in browser mode. Too wide a selection defeats it; too narrow hides a regression.
const graph = buildGraph();
const pick = (...changed: string[]) => [
	...affected(graph, [...graph.tests.browser, ...graph.tests.vrt], changed).keys(),
];
const dir = "packages/ui/src/lib/components";

describe("test-graph", () => {
	it("finds every test file", () => {
		expect(graph.tests.browser.length).toBeGreaterThan(150);
		expect(graph.tests.vrt.length).toBeGreaterThan(60);
	});

	it("a component reaches its own tests and its harnesses, and nothing unrelated", () => {
		const hit = pick(`${dir}/Avatar/Avatar.svelte`);
		expect(hit).toContain(`${dir}/Avatar/Avatar.svelte.test.ts`);
		expect(hit).toContain(`${dir}/Avatar/Avatar.vrt.test.ts`);
		expect(hit.some((t) => t.includes("/CommandPalette/"))).toBe(false);
		expect(hit.length).toBeLessThan(25);
	});

	it("reaches the tests of a component that renders the changed one", () => {
		// Button is rendered by many components; a change must reach their tests too
		const hit = pick(`${dir}/Button/Button.svelte`);
		expect(hit).toContain(`${dir}/Button/Button.svelte.test.ts`);
		expect(hit.length).toBeGreaterThan(20);
	});

	it("a stylesheet reaches the component that imports it", () => {
		const hit = pick(`${dir}/Dialog/dialog.css`);
		expect(hit).toContain(`${dir}/Dialog/Dialog.svelte.test.ts`);
	});

	it("a harness reaches only the tests that import it", () => {
		const hit = pick(`${dir}/Tabs/TabsMatrix.test.svelte`);
		expect(hit).toContain(`${dir}/Tabs/Tabs.vrt.test.ts`);
		expect(hit.length).toBeLessThan(5);
	});

	it("a changed screenshot reaches the test that took it", () => {
		const hit = pick(
			`${dir}/Tabs/__screenshots__/Tabs.vrt.test.ts/Tabs-dark-glass-chromium-darwin.png`
		);
		expect(hit).toEqual([`${dir}/Tabs/Tabs.vrt.test.ts`]);
	});

	it("a changed test file reaches itself", () => {
		expect(pick(`${dir}/Tabs/Tabs.svelte.test.ts`)).toEqual([`${dir}/Tabs/Tabs.svelte.test.ts`]);
	});

	it("an import cycle does not hide a dependent", () => {
		const cyc = {
			deps: new Map([
				["a.ts", new Set(["b.ts"])],
				["b.ts", new Set(["a.ts", "c.ts"])],
				["t.svelte.test.ts", new Set(["a.ts"])],
			]),
			tests: { browser: ["t.svelte.test.ts"], vrt: [], ssr: [] },
		};
		expect([...affected(cyc, cyc.tests.browser, ["c.ts"]).keys()]).toEqual(["t.svelte.test.ts"]);
	});

	it("keeps the barrel edge when a name cannot be traced, so the selection only grows", () => {
		// the package barrel is imported by name from a test or component: those names resolve to files
		expect(graph.deps.get("packages/ui/src/lib/index.ts")?.size ?? 0).toBeGreaterThan(50);
	});
});

// `issue-land.sh` picks the land budget from this: a shared change runs every component test and every route
// (360 s, no screenshots), anything else the affected ones plus the canaries (180 s).
describe("landBudget", () => {
	it("a component edit is under the 180 s budget", () => {
		expect(landBudget([`${dir}/Avatar/Avatar.svelte`])).toBe("land");
		expect(landBudget([`${dir}/Avatar/Avatar.svelte.test.ts`, "AGENTS.md"])).toBe("land");
		expect(landBudget([])).toBe("land");
	});

	it.each([
		"packages/ui/src/lib/styles/base.css",
		"packages/ui/src/lib/tokens/colors.ts",
		"packages/ui/src/lib/theme/index.ts",
		"packages/ui/src/lib/primitives/presence.svelte.ts",
		"packages/ui/tests/setup.browser.ts",
		"packages/ui/vite.config.ts",
		"site/src/layouts/Base.astro",
	])("%s is shared: the 360 s budget", (file) => {
		expect(landBudget([file])).toBe("landShared");
	});

	it("one shared file among ordinary ones is enough, and a file the route map does not know is shared", () => {
		expect(landBudget([`${dir}/Avatar/Avatar.svelte`, "packages/ui/src/lib/styles/base.css"])).toBe(
			"landShared"
		);
		expect(landBudget(["site/public/some-new-asset.svg"])).toBe("landShared");
	});

	it("isSharedComponent only flags what every component test renders through", () => {
		expect(isSharedComponent("packages/ui/src/lib/styles/base.css")).toBe(true);
		expect(isSharedComponent(`${dir}/Avatar/Avatar.svelte`)).toBe(false);
	});

	it("a test or harness in a shared directory is not itself shared", () => {
		for (const f of [
			"packages/ui/src/lib/actions/scroll-focusable.svelte.test.ts",
			"packages/ui/src/lib/actions/ScrollFocusableHarness.test.svelte",
			"packages/ui/src/lib/styles/default-style.svelte.test.ts",
		])
			expect(isSharedComponent(f)).toBe(false);
		expect(isSharedComponent("packages/ui/src/lib/actions/scroll-focusable.ts")).toBe(true);
	});
});
