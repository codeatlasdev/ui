import { describe, expect, it } from "bun:test";
import {
	affected,
	buildGraph,
	isSharedComponent,
	resolveBudget,
	widenedBecause,
} from "../../../scripts/test-graph";

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

// The budget follows the scope of the selection. A dependency bump (happy-dom, #588) correctly selects every
// component test, and the full set alone is ~80 s (95 s at load 10.5), over the 60 s `changed` budget that
// assumed a narrow selection. Widened to all components: `landShared`; narrow: `changed` (dev) or `land`.
describe("resolveBudget", () => {
	const narrow = [`${dir}/Avatar/Avatar.svelte`];

	it("a narrow selection keeps its budget and has no widening reason", () => {
		expect(resolveBudget(narrow, false)).toBe("changed");
		expect(resolveBudget([`${dir}/Avatar/Avatar.svelte.test.ts`, "AGENTS.md"], false)).toBe(
			"changed"
		);
		expect(resolveBudget([], false)).toBe("changed");
		expect(resolveBudget(narrow, true)).toBe("land");
		expect(resolveBudget([], true)).toBe("land");
		expect(widenedBecause(narrow)).toBeUndefined();
	});

	it.each([
		"packages/ui/src/lib/styles/base.css",
		"packages/ui/src/lib/tokens/colors.ts",
		"packages/ui/src/lib/theme/index.ts",
		"packages/ui/src/lib/primitives/presence.svelte.ts",
		"packages/ui/tests/setup.browser.ts",
		"packages/ui/vite.config.ts",
		"packages/ui/package.json",
		"site/src/layouts/Base.astro",
	])("%s widens to all components: landShared, dev run and land gate", (file) => {
		for (const land of [false, true])
			expect(resolveBudget([...narrow, file], land)).toBe("landShared");
		expect(widenedBecause([...narrow, file])).toBe(file);
	});

	it("a file the route map does not know widens too, and the reason names it", () => {
		const file = "site/public/some-new-asset.svg";
		expect(resolveBudget([file], false)).toBe("landShared");
		expect(widenedBecause([...narrow, file])).toBe(file);
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
