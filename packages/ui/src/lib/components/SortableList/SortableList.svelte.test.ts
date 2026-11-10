import { describe, expect, it } from "vitest";
import { cdp, page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { touchTarget } from "../../../../tests/touch-target";
import { VIEWPORTS } from "../../../../tests/viewports";
import type { SortableListReorder } from "./SortableList.svelte";
import Harness from "./SortableList.test.svelte";

const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)));
const rows = () =>
	[...document.querySelectorAll("[data-dnd-item]")].map((e) => e.getAttribute("data-dnd-item"));
const grip = (id: string) =>
	document.querySelector(`[data-dnd-item="${id}"] .ca-sortable__grip`) as HTMLElement;
const waitFor = (fn: () => boolean) => expect.poll(fn, { timeout: 30_000 }).toBe(true);
const live = () =>
	[...document.querySelectorAll("[data-ca-announcer]")].map((e) => e.textContent).join("|");
const key = (el: HTMLElement, k: string) => {
	el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
	return frame();
};

describe("SortableList (#750)", () => {
	it("renders a named list with a grip and a reorder menu per row", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness);
		await expect.element(screen.getByRole("list", { name: "Stages" })).toBeInTheDocument();
		expect(rows()).toEqual(["a", "b", "c", "d"]);
		await expect.element(screen.getByRole("button", { name: "Move Novo" })).toBeInTheDocument();
		await expect.element(screen.getByRole("button", { name: "Reorder Novo" })).toBeInTheDocument();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("keyboard: Space lifts the grip, Down moves, Enter drops and reports from/to", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const moves: SortableListReorder[] = [];
		await render(Harness, { moves });
		const g = grip("a");
		g.focus();
		await key(g, " ");
		await key(g, "ArrowDown");
		await key(g, "ArrowDown");
		await key(g, "Enter");
		await waitFor(() => moves.length === 1);
		expect(moves[0]).toEqual({ id: "a", from: 0, to: 2 });
		await waitFor(() => rows().join() === "b,c,a,d");
	});

	it("the reorder menu moves a row without dragging, and announces it", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		const moves: SortableListReorder[] = [];
		const screen = await render(Harness, { moves });
		await screen.getByRole("button", { name: "Reorder Ganho" }).click();
		await screen.getByRole("menuitem", { name: "Move up" }).click();
		await waitFor(() => moves.length === 1);
		expect(moves[0]).toEqual({ id: "c", from: 2, to: 1 });
		await waitFor(() => rows().join() === "a,c,b,d");
		await expect.poll(live, { timeout: 30_000 }).toContain("Ganho moved to position 2 of 4.");
	});

	it("the first row cannot move up and the last cannot move down", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness);
		await screen.getByRole("button", { name: "Reorder Novo" }).click();
		await expect
			.element(screen.getByRole("menuitem", { name: "Move up" }))
			.toHaveAttribute("aria-disabled", "true");
		await expect
			.element(screen.getByRole("menuitem", { name: "Move down" }))
			.not.toHaveAttribute("aria-disabled", "true");
	});

	it("does not reorder items itself: a rollback leaves the order alone", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const moves: SortableListReorder[] = [];
		const screen = await render(Harness, { moves, rollback: true });
		await screen.getByRole("button", { name: "Reorder Novo" }).click();
		await screen.getByRole("menuitem", { name: "Move down" }).click();
		await waitFor(() => moves.length === 1);
		await frame();
		expect(rows()).toEqual(["a", "b", "c", "d"]);
	});

	it("under a coarse pointer the grip and the menu are 44px targets", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		await cdp().send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
		try {
			await render(Harness);
			expect(matchMedia("(pointer: coarse)").matches).toBe(true);
			for (const sel of [".ca-sortable__grip", ".ca-sortable__menu"]) {
				const r = (document.querySelector(sel) as HTMLElement).getBoundingClientRect();
				expect(Math.min(r.width, r.height), sel).toBeGreaterThanOrEqual(touchTarget());
			}
		} finally {
			await cdp().send("Emulation.setTouchEmulationEnabled", { enabled: false });
		}
	});
});
