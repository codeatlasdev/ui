import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../tests/a11y";
import type { DndDropEvent } from "./dnd.js";
import LocaleHarness from "./dnd.locale.test.svelte";
import Harness from "./dnd.test.svelte";

const order = (c: Element) => c.querySelector("[data-testid=order]")?.textContent;
const grip = (c: Element, id: string) =>
	c.querySelector(`[data-dnd-item="${id}"] .grip`) as HTMLElement;
const row = (c: Element, id: string) => c.querySelector(`[data-dnd-item="${id}"]`) as HTMLElement;
const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)));
async function waitFor(fn: () => boolean, ms = 3000) {
	const end = Date.now() + ms;
	while (!fn()) {
		if (Date.now() > end) throw new Error("waitFor timed out");
		await new Promise((r) => setTimeout(r, 15));
	}
}
const live = () =>
	Array.from(document.querySelectorAll("[data-ca-announcer]"))
		.map((el) => el.textContent)
		.join("|");
const key = (el: HTMLElement, k: string) => {
	el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
	return frame();
};

function pointer(type: string, x: number, y: number, pointerType = "mouse", target?: EventTarget) {
	const ev = new PointerEvent(type, {
		bubbles: true,
		cancelable: true,
		composed: true,
		clientX: x,
		clientY: y,
		pointerId: 7,
		pointerType,
		isPrimary: true,
		button: 0,
	});
	(target ?? document).dispatchEvent(ev);
}
const center = (el: HTMLElement) => {
	const r = el.getBoundingClientRect();
	return [r.left + r.width / 2, r.top + r.height / 2] as const;
};

describe("dnd sortable (pointer)", () => {
	it("reorders inside a list and reports from/to", async () => {
		const drops: DndDropEvent[] = [];
		const screen = await render(Harness, { props: { drops } });
		const c = screen.container;
		const [x, y] = center(grip(c, "a1"));
		const [, y3] = center(row(c, "a3"));
		pointer("pointerdown", x, y, "mouse", grip(c, "a1"));
		pointer("pointermove", x, y + 10);
		pointer("pointermove", x, y3 + 12);
		await frame();
		expect(document.querySelector(".ca-dnd-overlay")).not.toBeNull();
		pointer("pointerup", x, y3 + 12);
		await frame();
		expect(order(c)).toBe("a:a2,a3,a1 | b:b1,b2");
		expect(drops).toHaveLength(1);
		expect(drops[0]).toMatchObject({
			id: "a1",
			from: { container: "a", index: 0 },
			to: { container: "a", index: 2 },
		});
		expect(document.querySelector(".ca-dnd-overlay")).toBeNull();
		expect(document.querySelector(".ca-dnd-indicator")).toBeNull();
	});

	it("does not start below the threshold, so a click stays a click", async () => {
		const drops: DndDropEvent[] = [];
		const screen = await render(Harness, { props: { drops } });
		const c = screen.container;
		const [x, y] = center(grip(c, "a1"));
		pointer("pointerdown", x, y, "mouse", grip(c, "a1"));
		pointer("pointermove", x + 1, y + 1);
		pointer("pointerup", x + 1, y + 1);
		expect(document.querySelector(".ca-dnd-overlay")).toBeNull();
		expect(drops).toHaveLength(0);
	});

	it("moves an item to another list of the same group", async () => {
		const drops: DndDropEvent[] = [];
		const screen = await render(Harness, { props: { drops } });
		const c = screen.container;
		const [x, y] = center(grip(c, "a2"));
		const [bx, by] = center(row(c, "b1"));
		pointer("pointerdown", x, y, "mouse", grip(c, "a2"));
		pointer("pointermove", x + 10, y);
		pointer("pointermove", bx, by + 14);
		pointer("pointerup", bx, by + 14);
		await frame();
		expect(order(c)).toBe("a:a1,a3 | b:b1,a2,b2");
		expect(drops[0].from.container).toBe("a");
		expect(drops[0].to).toEqual({ container: "b", index: 1 });
	});

	it("does not re-render the items while moving (same DOM nodes, no order change)", async () => {
		const screen = await render(Harness, {});
		const c = screen.container;
		const before = row(c, "a1");
		const [x, y] = center(grip(c, "a1"));
		pointer("pointerdown", x, y, "mouse", grip(c, "a1"));
		pointer("pointermove", x, y + 30);
		pointer("pointermove", x, y + 70);
		await frame();
		expect(order(c)).toBe("a:a1,a2,a3 | b:b1,b2");
		expect(row(c, "a1")).toBe(before);
		expect(before.hasAttribute("data-dnd-dragging")).toBe(true);
		pointer("pointerup", x, y + 70);
	});

	it("Escape during a pointer drag cancels without calling onDrop", async () => {
		const drops: DndDropEvent[] = [];
		const screen = await render(Harness, { props: { drops } });
		const c = screen.container;
		const [x, y] = center(grip(c, "a1"));
		pointer("pointerdown", x, y, "mouse", grip(c, "a1"));
		pointer("pointermove", x, y + 60);
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
		await frame();
		expect(order(c)).toBe("a:a1,a2,a3 | b:b1,b2");
		expect(drops).toHaveLength(0);
		expect(document.documentElement.hasAttribute("data-dnd-active")).toBe(false);
		// The overlay flies back to its slot, then goes away.
		await waitFor(() => document.querySelector(".ca-dnd-overlay") === null);
	});

	it("only the handle starts a drag when `handle` is set", async () => {
		const drops: DndDropEvent[] = [];
		const screen = await render(Harness, { props: { drops, handle: true } });
		const c = screen.container;
		const [x, y] = center(row(c, "a1"));
		// The row itself (outside .grip) is the same box here, so aim at the list padding instead.
		const list = c.querySelector("ul") as HTMLElement;
		const r = list.getBoundingClientRect();
		pointer("pointerdown", r.left + 3, r.top + 3, "mouse", list);
		pointer("pointermove", r.left + 3, r.top + 40);
		expect(document.querySelector(".ca-dnd-overlay")).toBeNull();
		pointer("pointerup", r.left + 3, r.top + 40);
		pointer("pointerdown", x, y, "mouse", grip(c, "a1"));
		pointer("pointermove", x, y + 40);
		expect(document.querySelector(".ca-dnd-overlay")).not.toBeNull();
		pointer("pointerup", x, y + 40);
	});
});

describe("dnd touch", () => {
	it("press and hold starts the drag; an early move is a scroll and gives up", async () => {
		const drops: DndDropEvent[] = [];
		const screen = await render(Harness, { props: { drops } });
		const c = screen.container;
		const [x, y] = center(grip(c, "a1"));
		pointer("pointerdown", x, y, "touch", grip(c, "a1"));
		pointer("pointermove", x, y + 30, "touch");
		await new Promise((r) => setTimeout(r, 200));
		expect(document.querySelector(".ca-dnd-overlay")).toBeNull();

		pointer("pointerdown", x, y, "touch", grip(c, "a1"));
		expect(row(c, "a1").hasAttribute("data-dnd-pressing")).toBe(true);
		await waitFor(() => document.querySelector(".ca-dnd-overlay") !== null);
		const [, y3] = center(row(c, "a3"));
		pointer("pointermove", x, y3 + 12, "touch");
		pointer("pointerup", x, y3 + 12, "touch");
		await frame();
		expect(order(c)).toBe("a:a2,a3,a1 | b:b1,b2");
	});
});

describe("dnd keyboard", () => {
	it("Space lifts, arrows move, Enter drops, with announcements", async () => {
		const drops: DndDropEvent[] = [];
		const screen = await render(Harness, { props: { drops } });
		const c = screen.container;
		const g = grip(c, "a1");
		g.focus();
		await key(g, " ");
		await waitFor(() => live().includes("Lifted a1, position 1 of 3"));
		await key(g, "ArrowDown");
		await key(g, "ArrowDown");
		await waitFor(() => live().includes("a1, position 3 of 3"));
		expect(order(c)).toBe("a:a1,a2,a3 | b:b1,b2");
		await key(g, "Enter");
		await waitFor(() => order(c) === "a:a2,a3,a1 | b:b1,b2");
		await waitFor(() => live().includes("Dropped a1, position 3 of 3"));
		expect(drops[0].to).toEqual({ container: "a", index: 2 });
	});

	it("focus follows the item after a drop re-renders the list", async () => {
		const screen = await render(Harness, {});
		const c = screen.container;
		grip(c, "a1").focus();
		await key(grip(c, "a1"), " ");
		await key(grip(c, "a1"), "ArrowDown");
		await key(grip(c, "a1"), "Enter");
		await waitFor(() => order(c) === "a:a2,a1,a3 | b:b1,b2");
		await waitFor(() => document.activeElement === grip(c, "a1"));
	});

	it("Escape cancels and announces; focus stays on the handle", async () => {
		const screen = await render(Harness, {});
		const c = screen.container;
		const g = grip(c, "a2");
		g.focus();
		await key(g, " ");
		await key(g, "ArrowUp");
		await key(g, "Escape");
		expect(order(c)).toBe("a:a1,a2,a3 | b:b1,b2");
		await waitFor(() => live().includes("Cancelled. a2 returned to its place."));
		expect(document.activeElement).toBe(g);
	});

	it("ArrowRight moves the item to the next list", async () => {
		const drops: DndDropEvent[] = [];
		const screen = await render(Harness, { props: { drops } });
		const c = screen.container;
		const g = grip(c, "a1");
		g.focus();
		await key(g, " ");
		await key(g, "ArrowRight");
		await waitFor(() => live().includes("List b"));
		await key(g, "Enter");
		await waitFor(() => (order(c) ?? "").startsWith("a:a2,a3 | b:a1,b1,b2"));
		expect(drops[0].to.container).toBe("b");
	});
});

describe("dnd drop zones", () => {
	it("dropping on a zone reports the zone and highlights it while over", async () => {
		const drops: DndDropEvent[] = [];
		const screen = await render(Harness, { props: { drops, zone: true } });
		const c = screen.container;
		const [x, y] = center(grip(c, "a3"));
		const zoneEl = c.querySelector("[data-dnd-zone]") as HTMLElement;
		const [zx, zy] = center(zoneEl);
		pointer("pointerdown", x, y, "mouse", grip(c, "a3"));
		pointer("pointermove", x + 12, y);
		pointer("pointermove", zx, zy);
		expect(zoneEl.hasAttribute("data-dnd-over")).toBe(true);
		pointer("pointerup", zx, zy);
		await frame();
		expect(zoneEl.hasAttribute("data-dnd-over")).toBe(false);
		expect(drops[0]).toMatchObject({ id: "a3", to: { container: "trash", index: 0 } });
		expect(order(c)).toBe("a:a1,a2 | b:b1,b2");
	});
});

describe("dnd a11y and motion", () => {
	it("has no axe violations idle and while a keyboard drag is active", async () => {
		const screen = await render(Harness, { props: { zone: true } });
		expect(await checkA11y(screen.container)).toHaveNoViolations();
		const g = grip(screen.container, "a1");
		g.focus();
		await key(g, " ");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
		await key(g, "Escape");
	});

	it("announces in the active locale", async () => {
		const screen = await render(LocaleHarness, { props: { locale: "pt-BR" } });
		const g = grip(screen.container, "a1");
		g.focus();
		await key(g, " ");
		await waitFor(() => live().includes("a1 pego, posição 1 de 3."));
		expect(
			document.getElementById(g.getAttribute("aria-describedby") as string)?.textContent
		).toContain("Pressione Espaço");
		await key(g, "Escape");
		await waitFor(() => live().includes("Cancelado. a1 voltou ao lugar."));
	});

	it("handles expose the instructions through aria-describedby", async () => {
		const screen = await render(Harness, {});
		const g = grip(screen.container, "a1");
		const id = g.getAttribute("aria-describedby") as string;
		expect(document.getElementById(id)?.textContent).toContain("Press Space to lift");
	});
});
