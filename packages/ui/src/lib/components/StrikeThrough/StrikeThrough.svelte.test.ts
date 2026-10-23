/// <reference types="@vitest/browser-playwright" />
import { createRawSnippet } from "svelte";
import { afterEach, describe, expect, it } from "vitest";
import { cdp } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { q } from "../../../../tests/dom";
import StrikeThrough from "./StrikeThrough.svelte";

const text = (t: string) => createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));
const emulate = (value: "reduce" | "no-preference") =>
	cdp().send("Emulation.setEmulatedMedia", {
		features: [{ name: "prefers-reduced-motion", value }],
	});
const line = (c: HTMLElement) => getComputedStyle(q(c, "del"), "::after");

afterEach(async () => {
	await cdp().send("Emulation.setEmulatedMedia", { features: [] });
});

describe("StrikeThrough", () => {
	it("renders a native <del> with its text", async () => {
		const screen = await render(StrikeThrough, { children: text("old") });
		expect(q(screen.container, "del").textContent).toBe("old");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("static strike is fully drawn", async () => {
		const screen = await render(StrikeThrough, { children: text("old") });
		expect(line(screen.container).animationName).toBe("none");
		expect(new DOMMatrix(line(screen.container).transform).a).toBeGreaterThan(0.99);
	});

	it("animated draws the line with an animation", async () => {
		await emulate("no-preference");
		const screen = await render(StrikeThrough, { animated: true, children: text("old") });
		expect(line(screen.container).animationName).not.toBe("none");
	});

	it("animated renders the final state under prefers-reduced-motion", async () => {
		await emulate("reduce");
		const screen = await render(StrikeThrough, { animated: true, children: text("old") });
		expect(line(screen.container).animationName).toBe("none");
		expect(new DOMMatrix(line(screen.container).transform).a).toBeGreaterThan(0.99);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});
