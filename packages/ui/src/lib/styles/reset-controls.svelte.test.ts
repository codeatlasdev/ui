import { afterEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import Harness from "../components/AppShell/AppShellHarness.test.svelte";
import Button from "../components/Button/Button.svelte";

/**
 * #266: a native control without its own font rule used to fall back to the UA font (Arial on
 * Chromium/Windows). The reset makes controls inherit the page font; component rules live in the
 * later `ca.components` layer, so they still win.
 */
const host = document.createElement("div");
afterEach(() => {
	host.remove();
	document.documentElement.style.removeProperty("--ca-font-sans");
});

const FONT = '"Courier New", monospace';

describe("form controls inherit the app font", () => {
	it("button, input, select and textarea use the body font", () => {
		document.documentElement.style.setProperty("--ca-font-sans", FONT);
		host.innerHTML = `<button type="button">b</button><input aria-label="i"><select aria-label="s"><option>o</option></select><textarea aria-label="t"></textarea>`;
		document.body.append(host);
		const body = getComputedStyle(document.body);
		expect(body.fontFamily).toContain("Courier New");
		for (const el of host.children) {
			const cs = getComputedStyle(el);
			expect(cs.fontFamily, el.tagName).toBe(body.fontFamily);
			expect(cs.fontSize, el.tagName).toBe(body.fontSize);
		}
	});

	it("the AppShell section header renders in the page font", async () => {
		document.documentElement.style.setProperty("--ca-font-sans", FONT);
		await render(Harness, { pathname: "/app/dashboard" });
		const label = document.querySelector(".ca-section__label") as HTMLElement;
		expect(label).not.toBeNull();
		expect(getComputedStyle(label).fontFamily).toContain("Courier New");
		expect(getComputedStyle(label.closest("button") as HTMLElement).fontFamily).toContain(
			"Courier New"
		);
	});

	it("component rules still win over the reset (Button keeps its own type scale)", async () => {
		const screen = await render(Button, { children: undefined, "aria-label": "x" });
		const btn = screen.container.querySelector("button") as HTMLElement;
		expect(getComputedStyle(btn).fontSize).not.toBe(getComputedStyle(document.body).fontSize);
	});
});
