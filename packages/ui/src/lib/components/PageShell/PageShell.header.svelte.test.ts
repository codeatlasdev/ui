import { Handshake } from "@lucide/svelte";
import { createRawSnippet } from "svelte";
import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { q } from "../../../../tests/dom";
import { settled } from "../../../../tests/settled";
import { VIEWPORTS } from "../../../../tests/viewports";
import PageShell from "./PageShell.svelte";
import ShellHost from "./PageShellShellCount.test.svelte";

const snip = (html: string) => createRawSnippet(() => ({ render: () => html }));

describe("PageShell header: icon tile, count, titleExtra (#739)", () => {
	it("renders a decorative icon tile before the title", async () => {
		const screen = await render(PageShell, { title: "Deals", icon: Handshake });
		const tile = q(screen.container, ".ca-page-shell__icon");
		expect(tile.getAttribute("aria-hidden")).toBe("true");
		expect(tile.querySelector("svg")).not.toBeNull();
		const h1 = q(screen.container, "h1");
		expect(tile.compareDocumentPosition(h1) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("the tile size and tint come from tokens", async () => {
		const screen = await render(PageShell, { title: "Deals", icon: Handshake });
		const tile = q(screen.container, ".ca-page-shell__icon");
		const before = tile.getBoundingClientRect().width;
		tile.style.setProperty("--ca-page-icon-size", "64px");
		expect(tile.getBoundingClientRect().width).toBe(64);
		expect(before).not.toBe(64);
	});

	it("count joins the heading's accessible name and the region's", async () => {
		const screen = await render(PageShell, {
			title: "Deals",
			count: 128,
			children: snip("<p>x</p>"),
		});
		await expect
			.element(screen.getByRole("heading", { level: 1, name: "Deals, 128" }))
			.toBeVisible();
		await expect.element(screen.getByRole("region", { name: "Deals, 128" })).toBeVisible();
		// The visible badge shows the number once; the name carries it once.
		const badge = q(screen.container, ".ca-page-shell__count");
		expect(badge.textContent?.trim()).toBe("128");
		expect(badge.getAttribute("aria-hidden")).toBe("true");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("accepts a string count and omits the badge without one", async () => {
		const withCount = await render(PageShell, { title: "Tasks", count: "12+" });
		await expect.element(withCount.getByRole("heading", { name: "Tasks, 12+" })).toBeVisible();
		const without = await render(PageShell, { title: "Tasks" });
		expect(without.container.querySelector(".ca-page-shell__count")).toBeNull();
		await expect
			.element(without.getByRole("heading", { name: "Tasks", exact: true }))
			.toBeVisible();
	});

	it("a zero count still shows", async () => {
		const screen = await render(PageShell, { title: "Tasks", count: 0 });
		await expect.element(screen.getByRole("heading", { name: "Tasks, 0" })).toBeVisible();
	});

	it("titleExtra renders inline after the title and the count", async () => {
		const screen = await render(PageShell, {
			title: "Deals",
			count: 3,
			titleExtra: snip("<span data-testid='extra'>3 late</span>"),
		});
		const extra = q(screen.container, "[data-testid='extra']");
		const count = q(screen.container, ".ca-page-shell__count");
		expect(count.compareDocumentPosition(extra) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		const h1 = q(screen.container, "h1").getBoundingClientRect();
		const e = extra.getBoundingClientRect();
		expect(Math.abs(e.top + e.height / 2 - (h1.top + h1.height / 2))).toBeLessThan(h1.height);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("the header shows for an icon or a count with no description or actions", async () => {
		const screen = await render(PageShell, { title: "Deals", icon: Handshake, count: 2 });
		expect(screen.container.querySelector(".ca-page-shell__header")).not.toBeNull();
	});

	it("inside a shell on mobile the count stays visible while the h1 is hidden", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		try {
			const screen = await render(ShellHost);
			await settled();
			const h1 = q(screen.container, "h1");
			expect(h1.getBoundingClientRect().width).toBeLessThanOrEqual(1);
			const badge = q(screen.container, ".ca-page-shell__count");
			expect(badge.getBoundingClientRect().width).toBeGreaterThan(8);
			await expect
				.element(screen.getByRole("heading", { level: 1, name: "Deals, 128" }))
				.toBeInTheDocument();
			expect(await checkA11y(screen.container)).toHaveNoViolations();
		} finally {
			await page.viewport(...VIEWPORTS.desktop);
		}
	});
});
