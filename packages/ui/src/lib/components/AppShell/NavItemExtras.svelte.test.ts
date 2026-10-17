import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import { VIEWPORTS } from "../../../../tests/viewports";
import Harness from "./NavItemExtras.test.svelte";

const q = (sel: string) => document.querySelector(sel);
const rows = () =>
	Array.from(document.querySelectorAll(".ca-nav-item__link .ca-nav-item__label")).map((a) =>
		a.textContent?.trim()
	);
const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)));
const key = (el: HTMLElement, k: string) => {
	el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
	return frame();
};
async function waitFor(fn: () => boolean, ms = 3000) {
	const end = Date.now() + ms;
	while (!fn()) {
		if (Date.now() > end) throw new Error("waitFor timed out");
		await new Promise((r) => setTimeout(r, 15));
	}
}

describe("NavItem: color and leading (#275)", () => {
	it("color renders a decorative dot that is not part of the link name", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, {});
		const dot = q(".ca-nav-item__color") as HTMLElement;
		expect(dot).not.toBeNull();
		expect(dot.getAttribute("aria-hidden")).toBe("true");
		expect(getComputedStyle(dot).backgroundColor).toBe("rgb(225, 29, 72)");
		await expect.element(screen.getByRole("link", { name: "Alpha 3 unread" })).toBeVisible();
	});

	it("leading replaces the icon", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(Harness, {});
		const link = page.getByRole("link", { name: "Custom leading" }).element() as HTMLElement;
		expect(link.querySelector("[data-testid=lead]")).not.toBeNull();
		expect(link.querySelector(".ca-nav-item__icon")).toBeNull();
	});
});

describe("NavItem: count (#275)", () => {
	it("is a neutral number, not announced as unread", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, {});
		const link = screen.getByRole("link", { name: "Beta 1200" });
		await expect.element(link).toBeVisible();
		expect(q(".ca-nav-item__count")?.textContent?.trim()).toBe("1.2k");
		expect(document.body.textContent).not.toContain("1200 unread");
	});

	it("a zero count still renders (an empty folder is information)", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, {});
		await expect.element(screen.getByRole("link", { name: "Gamma 0" })).toBeVisible();
	});
});

describe("NavItem: actions menu (#275)", () => {
	it("a sibling button of the link opens the menu, named after the item", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const picked: string[] = [];
		const screen = await render(Harness, { picked });
		const btn = screen.getByRole("button", { name: "Actions for Beta" });
		await expect.element(btn).toBeVisible();
		// The button is not inside the <a>: interactive content cannot nest in a link.
		expect((btn.element() as HTMLElement).closest("a")).toBeNull();
		await btn.click();
		await expect.element(screen.getByRole("menuitem", { name: "Favorite" })).toBeVisible();
		await screen.getByRole("menuitem", { name: "Archive" }).click();
		expect(picked).toEqual(["archive"]);
	});

	it("has no actions button on an item without actions", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, {});
		expect(screen.getByRole("button", { name: "Actions for Alpha" }).elements()).toHaveLength(0);
	});

	it("has no axe violations closed and open", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, {});
		await settled();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
		await screen.getByRole("button", { name: "Actions for Beta" }).click();
		await expect.element(screen.getByRole("menuitem", { name: "Favorite" })).toBeVisible();
		await settled();
		expect(await checkA11y(document.body)).toHaveNoViolations();
	});
});

describe("NavItem: reorder (#275)", () => {
	const grip = (name: string) => page.getByRole("button", { name: `Move ${name}` });

	it("has no grips unless the section has onReorder", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(Harness, {});
		expect(grip("Alpha").elements()).toHaveLength(0);
	});

	it("keyboard: Space lifts, arrows move, Enter drops, onReorder reports the move", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const drops: { id: string; from: number; to: number }[] = [];
		await render(Harness, { reorder: true, drops });
		const g = grip("Alpha").element() as HTMLElement;
		g.focus();
		await key(g, " ");
		await key(g, "ArrowDown");
		await key(g, "ArrowDown");
		await key(g, "Enter");
		await waitFor(() => rows().join() === "Beta,Gamma,Alpha,Custom leading");
		expect(drops).toEqual([{ id: "alpha", from: 0, to: 2 }]);
	});

	it("Escape cancels without calling onReorder", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const drops: { id: string; from: number; to: number }[] = [];
		await render(Harness, { reorder: true, drops });
		const g = grip("Beta").element() as HTMLElement;
		g.focus();
		await key(g, " ");
		await key(g, "ArrowUp");
		await key(g, "Escape");
		expect(drops).toHaveLength(0);
	});

	it("pointer drag on the grip reorders", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const drops: { id: string; from: number; to: number }[] = [];
		await render(Harness, { reorder: true, drops });
		const g = grip("Alpha").element() as HTMLElement;
		const from = g.getBoundingClientRect();
		const target = (q('[data-dnd-item="gamma"]') as HTMLElement).getBoundingClientRect();
		const ev = (type: string, x: number, y: number, t?: EventTarget) =>
			(t ?? document).dispatchEvent(
				new PointerEvent(type, {
					bubbles: true,
					cancelable: true,
					composed: true,
					clientX: x,
					clientY: y,
					pointerId: 3,
					pointerType: "mouse",
					isPrimary: true,
					button: 0,
				})
			);
		const x = from.left + from.width / 2;
		const y = from.top + from.height / 2;
		ev("pointerdown", x, y, g);
		ev("pointermove", x, y + 10);
		ev("pointermove", x, target.top + target.height - 4);
		await frame();
		ev("pointerup", x, target.top + target.height - 4);
		await waitFor(() => drops.length === 1);
		expect(drops[0]).toMatchObject({ id: "alpha", from: 0, to: 2 });
	});

	it("a link click still navigates (the grip, not the row, starts a drag)", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(Harness, { reorder: true });
		const link = page.getByRole("link", { name: "Beta 1200" }).element() as HTMLElement;
		expect(link.getAttribute("href")).toBe("/p/beta");
		expect(link.closest("[data-dnd-item]")).not.toBeNull();
	});

	it("has no axe violations with the grips", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, { reorder: true });
		await settled();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});
