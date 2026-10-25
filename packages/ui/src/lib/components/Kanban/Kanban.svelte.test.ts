import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { VIEWPORTS } from "../../../../tests/viewports";
import type { KanbanMove } from "./Kanban.svelte";
import Harness from "./Kanban.test.svelte";
import InShell from "./KanbanInShell.test.svelte";
import ParentHarness from "./KanbanParent.test.svelte";

type Card = { id: string; title: string };
const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)));
const card = (id: string) => document.querySelector(`[data-dnd-item="${id}"]`) as HTMLElement;
const col = (id: string) => document.querySelector(`[data-dnd-container="${id}"]`) as HTMLElement;
const ids = (c: string) =>
	[...col(c).querySelectorAll("[data-dnd-item]")].map((e) => e.getAttribute("data-dnd-item"));
const live = () =>
	[...document.querySelectorAll("[data-ca-announcer]")].map((e) => e.textContent).join("|");
// announce() writes its region a frame after the call and the text outlives a test (5 s), so a read
// right after an action can see the previous test's message: wait for the one being asserted.
const announced = (text: string) => expect.poll(live, { timeout: 30_000 }).toContain(text);
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
		await announced("Lifted");
		await key(handle, "ArrowRight");
		await key(handle, "ArrowRight");
		await announced("Won");
		await key(handle, "Enter");
		await waitFor(() => moves.length === 1);
		expect(moves[0].to).toEqual({ column: "won", index: 0 });
		await waitFor(() => ids("won").join() === "c2");
		await announced("Dropped");
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
		await announced("Cancelled");
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
		await announced("Ana Souza moved to Talking.");
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

	it("summary renders beside the count and keeps rail, title and count (light + dark)", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, { withSummary: true });
		const head = document.querySelector(
			"[data-kanban-column='new'] .ca-kanban__head"
		) as HTMLElement;
		expect(head.querySelector(".ca-kanban__rail")).not.toBeNull();
		expect(head.querySelector(".ca-kanban__title")?.textContent).toBe("New");
		expect(head.querySelector(".ca-kanban__count")?.textContent).toBe("15");
		const sum = head.querySelector(".ca-kanban__summary") as HTMLElement;
		expect(sum.textContent).toContain("R$ 1500");
		expect(sum.querySelector("[data-testid='sum-new']")).not.toBeNull();
		// Same row, after the count.
		const count = head.querySelector(".ca-kanban__count") as HTMLElement;
		expect(count.compareDocumentPosition(sum) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		expect(
			Math.abs(sum.getBoundingClientRect().top - count.getBoundingClientRect().top)
		).toBeLessThan(head.clientHeight);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
		document.documentElement.classList.add("dark");
		try {
			expect(await checkA11y(screen.container)).toHaveNoViolations();
		} finally {
			document.documentElement.classList.remove("dark");
		}
	});

	it("a custom header still replaces rail, title, count and summary", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(Harness, { withSummary: true, withHeader: true });
		const head = document.querySelector(
			"[data-kanban-column='new'] .ca-kanban__head"
		) as HTMLElement;
		expect(head.textContent).toContain("custom New");
		expect(
			head.querySelector(".ca-kanban__rail, .ca-kanban__count, .ca-kanban__summary")
		).toBeNull();
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

	it("summary shows in the active panel, tab keeps dot, label and count", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		const screen = await render(Harness, { withSummary: true });
		const tab = document.querySelector("[data-kanban-column='new']") as HTMLElement;
		expect(tab.querySelector(".ca-kanban__summary")?.textContent).toContain("R$ 1500");
		const t = document.querySelector(".ca-kanban__tab") as HTMLElement;
		expect(t.querySelector(".ca-kanban__dot")).not.toBeNull();
		expect(t.querySelector(".ca-kanban__count")?.textContent).toBe("15");
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

describe("Kanban inside flex and grid parents (390px)", () => {
	for (const parent of ["flex", "wrap", "nested", "grid"] as const) {
		it(`never widens the page, parent: ${parent}`, async () => {
			await page.viewport(...VIEWPORTS.mobile);
			await render(ParentHarness, { parent });
			await frame();
			const doc = document.documentElement;
			expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth);
			const root = document.querySelector(".ca-kanban") as HTMLElement;
			expect(root.getBoundingClientRect().right).toBeLessThanOrEqual(doc.clientWidth);
			// A definite-width parent is filled; an auto-width wrapper (the docs' own shape) still gets a
			// usable board, never a 0px sliver.
			expect(root.getBoundingClientRect().width).toBeGreaterThan(200);
		});
	}

	it("the board scrolls inside itself, not the page, in a wrapping flex parent", async () => {
		await page.viewport(800, 600);
		await render(ParentHarness, { parent: "wrap" });
		await frame();
		const doc = document.documentElement;
		expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth);
		const board = document.querySelector(".ca-kanban__board") as HTMLElement;
		expect(board.scrollWidth).toBeGreaterThan(board.clientWidth);
	});
});

describe("Kanban column heading level", () => {
	const levels = (root: Element) =>
		[...root.querySelectorAll(".ca-kanban__title")].map((e) => e.tagName);

	it("defaults to h2 under a PageShell h1, no heading-order violation", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(InShell, {});
		expect(levels(screen.container)).toEqual(["H2", "H2"]);
		expect(await checkA11y(screen.container, { runOnly: ["heading-order"] })).toHaveNoViolations();
	});

	it("headingLevel={3} renders h3", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(InShell, { headingLevel: 3 });
		expect(levels(screen.container)).toEqual(["H3", "H3"]);
	});

	it("the level never changes the look", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const sizes = new Set<string>();
		for (const headingLevel of [2, 3] as const) {
			const screen = await render(InShell, { headingLevel });
			const cs = getComputedStyle(document.querySelector(".ca-kanban__title") as HTMLElement);
			sizes.add(`${cs.fontSize}|${cs.fontWeight}|${cs.marginTop}|${cs.marginBottom}`);
			screen.unmount();
		}
		expect(sizes.size).toBe(1);
	});

	it("a custom header snippet replaces the title row and stays valid", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(InShell, { withHeader: true, headingLevel: 4 });
		expect(levels(screen.container)).toEqual([]);
		expect(document.querySelector("[data-testid='custom-new']")?.textContent).toBe("custom New");
		expect(await checkA11y(screen.container, { runOnly: ["heading-order"] })).toHaveNoViolations();
	});

	it("the mobile tab layout has no column headings and passes heading-order", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		const screen = await render(InShell, { headingLevel: 3 });
		expect(levels(screen.container)).toEqual([]);
		expect(screen.getByRole("tab").elements()).toHaveLength(2);
		expect(await checkA11y(screen.container, { runOnly: ["heading-order"] })).toHaveNoViolations();
	});
});
