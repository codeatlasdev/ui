import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import { VIEWPORTS } from "../../../../tests/viewports";
import Harness from "./PageAsideHarness.test.svelte";

const rect = (el: Element) => el.getBoundingClientRect();
const rem = () => Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
const q = (s: string) => document.querySelector(s) as HTMLElement;

type Kind = "frame" | "form" | "settings";

async function mount(
	kind: Kind,
	viewport: readonly [number, number],
	props: Record<string, unknown> = {}
) {
	await page.viewport(...viewport);
	const screen = await render(Harness, { kind, ...props });
	await settled();
	return screen;
}

const content = () => q('[data-testid="content"]');
const aside = () => q("aside");

afterEach(async () => {
	await page.viewport(...VIEWPORTS.desktop);
});

describe.each<Kind>(["frame", "form", "settings"])("aside slot on %s (#719)", (kind) => {
	it("two columns from 1280px: aside right of the content, sticky at the top", async () => {
		const screen = await mount(kind, VIEWPORTS.desktop);
		expect(aside().tagName).toBe("ASIDE");
		expect(rect(aside()).left).toBeGreaterThanOrEqual(rect(content()).right);
		expect(getComputedStyle(aside()).position).toBe("sticky");
		expect(getComputedStyle(aside()).top).toBe("0px");
		expect(Math.abs(rect(aside()).width - 20 * rem())).toBeLessThan(1);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("asideWidth sets the column width", async () => {
		await mount(kind, VIEWPORTS.desktop, { asideWidth: "24rem" });
		expect(Math.abs(rect(aside()).width - 24 * rem())).toBeLessThan(1);
	});

	it("one column at 390px: aside after the content, no sideways overflow", async () => {
		const screen = await mount(kind, VIEWPORTS.mobile);
		expect(rect(aside()).top).toBeGreaterThanOrEqual(rect(content()).bottom);
		expect(getComputedStyle(aside()).position).not.toBe("sticky");
		expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
		expect(rect(aside()).right).toBeLessThanOrEqual(window.innerWidth);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("the aside is a named landmark; asideLabel overrides the default", async () => {
		await mount(kind, VIEWPORTS.desktop);
		expect(aside().getAttribute("aria-label")).toBe("Page sidebar");
		await page.viewport(...VIEWPORTS.desktop);
		const named = await render(Harness, { kind, asideLabel: "Preview" });
		await settled();
		expect(named.container.querySelector("aside")?.getAttribute("aria-label")).toBe("Preview");
	});

	it("without an aside nothing changes: no aside element", async () => {
		await mount(kind, VIEWPORTS.desktop, { withAside: false });
		expect(document.querySelector("aside")).toBeNull();
	});
});
