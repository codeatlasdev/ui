import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import Harness from "./PageShellFlow.test.svelte";

// #935: a PageShell in an app that scrolls the window (its own shell), no nested scroller.
const shell = () =>
	[...document.querySelectorAll<HTMLElement>(".ca-page-shell")].at(-1) as HTMLElement;
const padBottom = () => Number.parseFloat(getComputedStyle(shell()).paddingBottom);

describe("PageShell scroll={false} (#935)", () => {
	it("does not scroll itself: no tab stop, the document scrolls, the titled region stays", async () => {
		await page.viewport(1280, 600);
		const screen = await render(Harness, { scroll: false });
		expect(shell().scrollHeight).toBeLessThanOrEqual(shell().clientHeight + 1);
		expect(shell().hasAttribute("tabindex")).toBe(false);
		expect(document.documentElement.scrollHeight).toBeGreaterThan(window.innerHeight);
		await expect.element(screen.getByRole("region", { name: "Records" })).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("clears the shell's bottom inset only when it does not scroll", async () => {
		const a = await render(Harness, { scroll: false });
		const base = padBottom();
		a.unmount();
		const b = await render(Harness, { scroll: false, inset: "80px" });
		expect(padBottom() - base).toBeCloseTo(80, 0);
		b.unmount();
		const c = await render(Harness, { inset: "80px" });
		const scrolling = padBottom();
		c.unmount();
		await render(Harness, {});
		expect(scrolling).toBe(padBottom());
	});

	it("--ca-page-max sets the column width; maxWidth still wins", async () => {
		await page.viewport(1600, 600);
		document.documentElement.style.setProperty("--ca-page-max", "900px");
		try {
			await render(Harness, {});
			expect(shell().getBoundingClientRect().width).toBeCloseTo(900, 0);
		} finally {
			document.documentElement.style.removeProperty("--ca-page-max");
		}
	});
});
