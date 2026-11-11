import { createRawSnippet } from "svelte";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { q } from "../../../../tests/dom";
import Heading from "./Heading.svelte";

const text = (t: string) => createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));
const root = document.documentElement;

describe("Heading", () => {
	it("renders the level as a native heading element", async () => {
		const screen = await render(Heading, { level: 2, children: text("Title") });
		expect(q(screen.container, "h2").textContent).toBe("Title");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("display size uses the display font, tracking and leading tokens", async () => {
		root.style.setProperty("--ca-font-display", "Fraunces, serif");
		root.style.setProperty("--ca-display-tracking", "-0.055em");
		root.style.setProperty("--ca-display-leading", "0.84");
		try {
			const screen = await render(Heading, { level: 1, size: "display", children: text("Hello") });
			const h = getComputedStyle(q(screen.container, "h1"));
			expect(h.fontFamily).toContain("Fraunces");
			expect(parseFloat(h.letterSpacing)).toBeLessThan(0);
			expect(parseFloat(h.lineHeight) / parseFloat(h.fontSize)).toBeCloseTo(0.84, 2);
			expect(await checkA11y(screen.container)).toHaveNoViolations();
		} finally {
			for (const p of ["--ca-font-display", "--ca-display-tracking", "--ca-display-leading"])
				root.style.removeProperty(p);
		}
	});

	it("falls back to the body font when no display font is set", async () => {
		const screen = await render(Heading, { level: 1, size: "display", children: text("Hello") });
		const probe = document.createElement("p");
		probe.style.fontFamily = "var(--ca-font-sans)";
		document.body.append(probe);
		try {
			expect(getComputedStyle(q(screen.container, "h1")).fontFamily).toBe(
				getComputedStyle(probe).fontFamily
			);
		} finally {
			probe.remove();
		}
	});
	it("size decouples the look from the level", async () => {
		const small = await render(Heading, { level: 1, size: "h6", children: text("S") });
		const big = await render(Heading, { level: 1, size: "display", children: text("B") });
		expect(parseFloat(getComputedStyle(q(big.container, "h1")).fontSize)).toBeGreaterThan(
			parseFloat(getComputedStyle(q(small.container, "h1")).fontSize)
		);
	});
	it("display-3 follows a fluid --ca-font-size-display-3 from the theme, with tracking and leading (#691)", async () => {
		const tokens = {
			"--ca-font-size-display-3": "clamp(36px, 22.4px + 3.6vw, 56px)",
			"--ca-display-tracking": "-0.035em",
			"--ca-display-leading": "1",
		};
		for (const [k, v] of Object.entries(tokens)) root.style.setProperty(k, v);
		try {
			const screen = await render(Heading, { level: 1, size: "display-3", children: text("Hi") });
			const h = q(screen.container, "h1");
			const size = () => parseFloat(getComputedStyle(h).fontSize);
			const fluid = (vw: number) => Math.min(56, Math.max(36, 22.4 + 0.036 * vw));
			// The fluid step is evaluated against the real viewport; assert the formula at it,
			// and that it sits inside the configured clamp bounds.
			expect(size()).toBeCloseTo(fluid(document.documentElement.clientWidth), 1);
			expect(size()).toBeGreaterThanOrEqual(36);
			expect(size()).toBeLessThanOrEqual(56);
			const cs = getComputedStyle(h);
			expect(parseFloat(cs.letterSpacing) / size()).toBeCloseTo(-0.035, 3);
			expect(parseFloat(cs.lineHeight) / size()).toBeCloseTo(1, 3);
		} finally {
			for (const k of Object.keys(tokens)) root.style.removeProperty(k);
		}
	});
});
