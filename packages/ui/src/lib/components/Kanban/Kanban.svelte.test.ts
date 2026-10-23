import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { VIEWPORTS } from "../../../../tests/viewports";
import type { KanbanMove } from "./Kanban.svelte";
import Harness from "./Kanban.test.svelte";

type Card = { id: string; title: string };
const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)));
const card = (id: string) => document.querySelector(`[data-dnd-item="${id}"]`) as HTMLElement;
const col = (id: string) => document.querySelector(`[data-dnd-container="${id}"]`) as HTMLElement;
const ids = (c: string) =>
	[...col(c).querySelectorAll("[data-dnd-item]")].map((e) => e.getAttribute("data-dnd-item"));
const live = () =>
	[...document.querySelectorAll("[data-ca-announcer]")].map((e) => e.textContent).join("|");
const center = (el: HTMLElement) => {
	const r = el.getBoundingClientRect();
	return [r.left + r.width / 2, r.top + r.height / 2] as const;
};
function pointer(type: string, x: number, y: number, target?: EventTarget, pointerType = "mouse") {
	(target ?? document).dispatchEvent(
		new PointerEvent(type, {
			bubbles: true,
			cancelable: true,
			composed: true,
			clientX: x,
			clientY: y,
			pointerId: 3,
			pointerType,
			isPrimary: true,
			button: 0,
		})
	);
}
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

describe("Kanban board (desktop)", () => {
	it("renders a fixed header per column and independently scrolling lists", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness);
		await expect.element(screen.getByRole("region", { name: "Leads" })).toBeInTheDocument();
		const head = document.querySelector(
			"[data-kanban-column='new'] .ca-kanban__head"
		) as HTMLElement;
		expect(head.textContent).toContain("New");
		expect(head.textContent).toContain("15");
		expect(getComputedStyle(col("new")).overflowY).toMatch(/auto|scroll/);
		expect(
			getComputedStyle(document.querySelector(".ca-kanban__board") as HTMLElement).overflowX
		).toMatch(/auto|scroll/);
		expect(document.querySelector("[data-kanban-column='won']")?.textContent).toContain(
			"Nothing in Won"
		);
	});

	it("mouse drag moves a card to another column, no insertion line, column highlighted", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const moves: KanbanMove<Card>[] = [];
		await render(Harness, { moves });
		const [x, y] = center(card("c1"));
		const [tx, ty] = center(col("talk"));
		pointer("pointerdown", x, y, card("c1"));
		pointer("pointermove", x, y + 8);
		pointer("pointermove", tx, ty);
		await frame();
		const ind = document.querySelector(".ca-dnd-indicator") as HTMLElement | null;
		expect(!ind || ind.hidden).toBe(true);
		expect(col("talk").hasAttribute("data-dnd-over")).toBe(true);
		pointer("pointerup", tx, ty);
		await waitFor(() => moves.length === 1);
		expect(moves[0].card.id).toBe("c1");
		expect(moves[0].from).toEqual({ column: "new", index: 0 });
		expect(moves[0].to).toEqual({ column: "talk", index: 0 });
		await waitFor(() => ids("talk").join() === "c1,c4");
	});

	it("drop=position keeps the insertion index", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const moves: KanbanMove<Card>[] = [];
		await render(Harness, { moves, drop: "position" });
		const [x, y] = center(card("c1"));
		const r = card("c4").getBoundingClientRect();
		pointer("pointerdown", x, y, card("c1"));
		pointer("pointermove", x, y + 8);
		pointer("pointermove", r.left + r.width / 2, r.bottom - 2);
		await frame();
		pointer("pointerup", r.left + r.width / 2, r.bottom - 2);
		await waitFor(() => moves.length === 1);
		expect(moves[0].to).toEqual({ column: "talk", index: 1 });
	});

	it("keyboard: Space lifts, Right goes to the next column (even empty), Enter drops, announced", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const moves: KanbanMove<Card>[] = [];
		await render(Harness, { moves });
		const handle = card("c2").querySelector("button, [tabindex]") as HTMLElement;
		handle.focus();
		await key(handle, " ");
		expect(live()).toContain("Lifted");
		await key(handle, "ArrowRight");
		await key(handle, "ArrowRight");
		expect(live()).toContain("Won");
		await key(handle, "Enter");
		await waitFor(() => moves.length === 1);
		expect(moves[0].to).toEqual({ column: "won", index: 0 });
		await waitFor(() => ids("won").join() === "c2");
		expect(live()).toContain("Dropped");
	});

	it("Escape cancels a keyboard move", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const moves: KanbanMove<Card>[] = [];
		await render(Harness, { moves });
		const handle = card("c1").querySelector("button, [tabindex]") as HTMLElement;
		handle.focus();
		await key(handle, " ");
		await key(handle, "ArrowRight");
		await key(handle, "Escape");
		await frame();
		expect(moves).toHaveLength(0);
		expect(live()).toContain("Cancelled");
	});

	it("canMove=false turns the drag off", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const moves: KanbanMove<Card>[] = [];
		await render(Harness, { moves, canMove: false });
		const [x, y] = center(card("c1"));
		const [tx, ty] = center(col("talk"));
		pointer("pointerdown", x, y, card("c1"));
		pointer("pointermove", x, y + 8);
		pointer("pointermove", tx, ty);
		pointer("pointerup", tx, ty);
		await frame();
		expect(moves).toHaveLength(0);
		expect(document.querySelector(".ca-kanban__move")).toBeNull();
	});

	it("'Move to…' menu moves a card without dragging and announces it", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const moves: KanbanMove<Card>[] = [];
		const screen = await render(Harness, { moves });
		await screen.getByRole("button", { name: "Move Ana Souza to…" }).click();
		await expect.element(screen.getByRole("menuitem", { name: "Talking" })).toBeInTheDocument();
		// the card's own column is not offered
		expect(screen.getByRole("menuitem", { name: "New" }).elements()).toHaveLength(0);
		await screen.getByRole("menuitem", { name: "Talking" }).click();
		await waitFor(() => moves.length === 1);
		expect(moves[0].to.column).toBe("talk");
		expect(live()).toContain("Ana Souza moved to Talking.");
	});

	it("onloadmore fires near the end of a column list and the fallback button works", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const loads: string[] = [];
		const screen = await render(Harness, { loads, more: true });
		const btn = screen.getByRole("button", { name: "Load more (27)" });
		await expect.element(btn).toBeInTheDocument();
		await btn.click();
		expect(loads).toEqual(["new"]);
		loads.length = 0;
		// scrolling the list to its end asks for the next page too
		const list = col("new");
		list.scrollTop = list.scrollHeight;
		await waitFor(() => loads.length > 0);
		expect(loads[0]).toBe("new");
	});

	it("shows skeleton cards while a page loads and has no axe violations", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, { more: true, loadingMore: true });
		expect(
			document.querySelectorAll("[data-kanban-column='new'] .ca-kanban__skeleton").length
		).toBeGreaterThan(0);
		expect(document.querySelector("[data-kanban-column='new']")?.getAttribute("aria-busy")).toBe(
			"true"
		);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("pans the board with the mouse on the background and turns the wheel sideways", async () => {
		await page.viewport(800, 600);
		await render(Harness);
		const board = document.querySelector(".ca-kanban__board") as HTMLElement;
		expect(board.scrollWidth).toBeGreaterThan(board.clientWidth);
		const r = board.getBoundingClientRect();
		const gap = [r.left + 6, r.top + 8] as const;
		pointer("pointerdown", gap[0] + 300, gap[1], board);
		pointer("pointermove", gap[0] + 200, gap[1]);
		pointer("pointermove", gap[0] + 100, gap[1]);
		pointer("pointerup", gap[0] + 100, gap[1]);
		expect(board.scrollLeft).toBeGreaterThan(50);
		board.scrollLeft = 0;
		// vertical wheel over the board background (not a column list) scrolls sideways
		board.dispatchEvent(new WheelEvent("wheel", { deltaY: 120, bubbles: true, cancelable: true }));
		expect(board.scrollLeft).toBeGreaterThan(0);
		const left = board.scrollLeft;
		// trackpad deltaX is left native
		const ev = new WheelEvent("wheel", { deltaX: 80, deltaY: 2, bubbles: true, cancelable: true });
		board.dispatchEvent(ev);
		expect(ev.defaultPrevented).toBe(false);
		expect(board.scrollLeft).toBe(left);
	});

	it("shows an edge fade only on the side with hidden content", async () => {
		await page.viewport(800, 600);
		await render(Harness);
		const root = document.querySelector(".ca-kanban") as HTMLElement;
		const board = document.querySelector(".ca-kanban__board") as HTMLElement;
		await waitFor(() => root.dataset.fade === "end");
		board.scrollLeft = board.scrollWidth;
		await waitFor(() => root.dataset.fade === "start");
		board.scrollLeft = 40;
		await waitFor(() => root.dataset.fade === "both");
	});
});

describe("Kanban mobile (390px)", () => {
	it("is a tablist, one column at a time, with 44px targets and no board scroll", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		const screen = await render(Harness);
		await expect.element(screen.getByRole("tab", { name: /New/ })).toBeInTheDocument();
		const tabs = screen.getByRole("tab");
		expect(tabs.elements()).toHaveLength(5);
		for (const t of tabs.elements())
			expect(t.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
		await expect
			.element(screen.getByRole("tab", { name: /New/ }))
			.toHaveAttribute("aria-selected", "true");
		expect(document.querySelectorAll("[data-kanban-column]:not([hidden])")).toHaveLength(1);
		expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
			document.documentElement.clientWidth
		);
		const board = document.querySelector(".ca-kanban__board") as HTMLElement;
		expect(board.scrollWidth).toBeLessThanOrEqual(board.clientWidth + 1);
		await screen.getByRole("tab", { name: /Talking/ }).click();
		await expect
			.element(screen.getByRole("tab", { name: /Talking/ }))
			.toHaveAttribute("aria-selected", "true");
		expect(ids("talk")).toEqual(["c4"]);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("arrow keys move between tabs and 'Move to…' works without drag", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		const moves: KanbanMove<Card>[] = [];
		const screen = await render(Harness, { moves });
		(screen.getByRole("tab", { name: /New/ }).element() as HTMLElement).focus();
		await userEvent.keyboard("{ArrowRight}");
		await expect
			.element(screen.getByRole("tab", { name: /Talking/ }))
			.toHaveAttribute("aria-selected", "true");
		await userEvent.keyboard("{ArrowLeft}");
		await expect
			.element(screen.getByRole("tab", { name: /New/ }))
			.toHaveAttribute("aria-selected", "true");
		const btn = screen.getByRole("button", { name: "Move Ana Souza to…" });
		expect(btn.element().getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
		await btn.click();
		await screen.getByRole("menuitem", { name: "Won" }).click();
		await waitFor(() => moves.length === 1);
		expect(moves[0].to.column).toBe("won");
	});

	it("compact forces the tab layout on a wide screen", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, { compact: true });
		expect(screen.getByRole("tab").elements()).toHaveLength(5);
	});
});
