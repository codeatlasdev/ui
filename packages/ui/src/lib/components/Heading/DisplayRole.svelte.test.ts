import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { q } from "../../../../tests/dom";
import AuthCard from "../AuthLayout/AuthCard.svelte";
import EmptyState from "../EmptyState/EmptyState.svelte";
import PageShell from "../PageShell/PageShell.svelte";
import Harness from "../SiteHeader/SiteHeaderHarness.test.svelte";

const root = document.documentElement;
const TOKENS = { "--ca-display-tracking": "-0.055em", "--ca-display-leading": "0.84" };

async function withDisplayTokens(fn: () => Promise<void>) {
	for (const [k, v] of Object.entries(TOKENS)) root.style.setProperty(k, v);
	try {
		await fn();
	} finally {
		for (const k of Object.keys(TOKENS)) root.style.removeProperty(k);
	}
}

const leading = (el: Element) => {
	const c = getComputedStyle(el);
	return parseFloat(c.lineHeight) / parseFloat(c.fontSize);
};

describe("display text role on titles", () => {
	it("AuthCard display applies the display tokens, default does not", async () => {
		await withDisplayTokens(async () => {
			const on = await render(AuthCard, { title: "Welcome", display: true });
			const off = await render(AuthCard, { title: "Welcome" });
			expect(leading(q(on.container, "h1"))).toBeCloseTo(0.84, 2);
			expect(leading(q(off.container, "h1"))).not.toBeCloseTo(0.84, 1);
			expect(await checkA11y(on.container)).toHaveNoViolations();
		});
	});

	it("PageShell display applies the display tokens", async () => {
		await withDisplayTokens(async () => {
			const on = await render(PageShell, { title: "Reports", display: true });
			const off = await render(PageShell, { title: "Reports" });
			expect(leading(q(on.container, "h1"))).toBeCloseTo(0.84, 2);
			expect(leading(q(off.container, "h1"))).not.toBeCloseTo(0.84, 1);
		});
	});

	it("EmptyState display wins over the hero title size and applies tokens", async () => {
		await withDisplayTokens(async () => {
			const on = await render(EmptyState, { title: "Nothing", variant: "hero", display: true });
			const off = await render(EmptyState, { title: "Nothing", variant: "hero" });
			expect(leading(q(on.container, "h5"))).toBeCloseTo(0.84, 2);
			expect(leading(q(off.container, "h5"))).not.toBeCloseTo(0.84, 1);
			expect(await checkA11y(on.container)).toHaveNoViolations();
		});
	});

	it("SiteHeader display styles the current crumb with the display tracking", async () => {
		await withDisplayTokens(async () => {
			const on = await render(Harness, { display: true });
			const off = await render(Harness, {});
			const cur = (s: typeof on) =>
				getComputedStyle(q(s.container, "[aria-current=page]")).letterSpacing;
			expect(parseFloat(cur(on))).toBeLessThan(0);
			expect(cur(off)).toBe("normal");
		});
	});
});
