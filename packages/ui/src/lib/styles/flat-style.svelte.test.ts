import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import Harness from "../components/ResizablePanels/ResizablePanelsHarness.test.svelte";
import { withTheme } from "../testing/index.js";

// #919: `flat` must be flat: no glass fill, no material shadow, no brand line on a resting divider.
let restore = () => {};
afterEach(() => restore());

/** A colour as the browser computes it, for comparing a token with what it should equal. */
const color = (value: string) => {
	const probe = document.createElement("div");
	probe.style.color = value;
	document.body.append(probe);
	const c = getComputedStyle(probe).color;
	probe.remove();
	return c;
};

describe('defaultStyle "flat" (#919)', () => {
	it("--ca-glass-bg is the raised surface, not a translucent glass tint", () => {
		restore = withTheme({ style: "flat" });
		expect(color("var(--ca-glass-bg)")).toBe(color("var(--ca-surface-raised)"));
	});

	it("material shadows are off", () => {
		restore = withTheme({ style: "flat" });
		const probe = document.createElement("div");
		probe.style.boxShadow = "var(--ca-mat-regular-shadow)";
		document.body.append(probe);
		const shadow = getComputedStyle(probe).boxShadow;
		probe.remove();
		expect(shadow === "none" || /0px 0px 0px 0px/.test(shadow)).toBe(true);
	});

	it("a hovered divider is not painted in the brand colour; a focused one is", async () => {
		restore = withTheme({ style: "flat" });
		const screen = await render(Harness, {});
		const handle = screen.container.querySelector(".ca-resizable__handle") as HTMLElement;
		await userEvent.hover(handle);
		expect(getComputedStyle(handle).backgroundColor).not.toBe(color("var(--ca-brand-fill)"));
		handle.focus();
		await userEvent.keyboard("{ArrowRight}");
		expect(getComputedStyle(handle).backgroundColor).toBe(color("var(--ca-brand-fill)"));
	});
});
