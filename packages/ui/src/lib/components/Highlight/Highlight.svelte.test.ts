/// <reference types="@vitest/browser-playwright" />
import { createRawSnippet } from "svelte";
import { afterEach, describe, expect, it } from "vitest";
import { cdp } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { q } from "../../../../tests/dom";
import Highlight from "./Highlight.svelte";

const text = (t: string) => createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));
const emulate = (value: "reduce" | "no-preference") =>
	cdp().send("Emulation.setEmulatedMedia", {
		features: [{ name: "prefers-reduced-motion", value }],
	});

afterEach(async () => {
	await cdp().send("Emulation.setEmulatedMedia", { features: [] });
});

describe("Highlight", () => {
	it("renders a native <mark> with its text", async () => {
		const screen = await render(Highlight, { children: text("important") });
		expect(q(screen.container, "mark").textContent).toBe("important");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("animated=false paints the full highlight and no animation", async () => {
		const screen = await render(Highlight, { children: text("x") });
		const cs = getComputedStyle(q(screen.container, "mark"));
		expect(cs.animationName).toBe("none");
		expect(cs.backgroundSize.split(" ")[0]).toBe("100%");
	});

	it("animated sweeps in with the editorial easing", async () => {
		await emulate("no-preference");
		const screen = await render(Highlight, { animated: true, children: text("x") });
		const cs = getComputedStyle(q(screen.container, "mark"));
		expect(cs.animationName).not.toBe("none");
		const probe = document.createElement("i");
		probe.style.transitionTimingFunction = "var(--ca-ease-out-expo)";
		document.body.append(probe);
		expect(cs.animationTimingFunction).toBe(getComputedStyle(probe).transitionTimingFunction);
		expect(cs.animationTimingFunction).toMatch(/^cubic-bezier\(0\.16/);
		probe.remove();
	});

	it("animated renders the final state under prefers-reduced-motion", async () => {
		await emulate("reduce");
		const screen = await render(Highlight, { animated: true, children: text("x") });
		const cs = getComputedStyle(q(screen.container, "mark"));
		expect(cs.animationName).toBe("none");
		expect(cs.backgroundSize.split(" ")[0]).toBe("100%");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});
