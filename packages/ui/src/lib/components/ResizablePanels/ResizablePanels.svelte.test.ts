import { beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { q } from "../../../../tests/dom";
import Harness from "./ResizablePanelsHarness.test.svelte";

const handles = (c: HTMLElement) => [...c.querySelectorAll<HTMLElement>('[role="separator"]')];
const widths = (c: HTMLElement) =>
	[...c.querySelectorAll<HTMLElement>(".ca-resizable__panel")].map((p) =>
		Math.round(p.getBoundingClientRect().width)
	);
const heights = (c: HTMLElement) =>
	[...c.querySelectorAll<HTMLElement>(".ca-resizable__panel")].map((p) =>
		Math.round(p.getBoundingClientRect().height)
	);

beforeEach(() => localStorage.clear());

describe("ResizablePanels layout", () => {
	it("splits the group by defaultSize and the panels fill it", async () => {
		const screen = await render(Harness, {});
		const [a, b] = widths(screen.container);
		expect(a + b).toBeGreaterThan(590);
		expect(Math.abs(a - b)).toBeLessThan(8);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("vertical direction splits the height", async () => {
		const screen = await render(Harness, { direction: "vertical" });
		const [a, b] = heights(screen.container);
		expect(a + b).toBeGreaterThan(290);
		expect(Math.abs(a - b)).toBeLessThan(8);
		expect(handles(screen.container)[0].getAttribute("aria-orientation")).toBe("horizontal");
	});

	it("names the group and every handle", async () => {
		const screen = await render(Harness, { three: true });
		expect(q(screen.container, '[role="group"]').getAttribute("aria-label")).toBe("Editor layout");
		expect(handles(screen.container).map((h) => h.getAttribute("aria-label"))).toEqual([
			"Resize sidebar",
			"Resize inspector",
		]);
	});
});

describe("ResizablePanels scrolling", () => {
	it("a panel whose content overflows scrolls by keyboard, and axe passes", async () => {
		const screen = await render(Harness, { wide: true, min: 5 });
		const panel = q(screen.container, ".ca-resizable__panel");
		panel.style.width = "40px";
		panel.style.flex = "none";
		expect(panel.scrollWidth).toBeGreaterThan(panel.clientWidth);
		expect(panel.tabIndex).toBe(0);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});

describe("ResizablePanels window splitter (APG)", () => {
	it("separator exposes the size of the panel before it, with min and max", async () => {
		const screen = await render(Harness, { min: 20, max: 80 });
		const h = handles(screen.container)[0];
		expect(h.getAttribute("tabindex")).toBe("0");
		expect(h.getAttribute("aria-orientation")).toBe("vertical");
		expect(h.getAttribute("aria-valuenow")).toBe("50");
		expect(h.getAttribute("aria-valuemin")).toBe("20");
		expect(h.getAttribute("aria-valuemax")).toBe("80");
		expect(h.getAttribute("aria-controls")).toBe(q(screen.container, ".ca-resizable__panel").id);
	});

	it("arrow keys move the splitter by 1%, shift by 10%, in the arrow's direction", async () => {
		const onlayout = vi.fn();
		const screen = await render(Harness, { onlayout });
		const h = handles(screen.container)[0];
		h.focus();
		await userEvent.keyboard("{ArrowRight}");
		expect(h.getAttribute("aria-valuenow")).toBe("51");
		await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
		expect(h.getAttribute("aria-valuenow")).toBe("49");
		await userEvent.keyboard("{Shift>}{ArrowRight}{/Shift}");
		expect(h.getAttribute("aria-valuenow")).toBe("59");
		const [a, b] = widths(screen.container);
		expect(Math.abs(a / (a + b) - 0.59)).toBeLessThan(0.02);
		expect(onlayout).toHaveBeenLastCalledWith([59, 41]);
	});

	it("vertical groups use Up and Down", async () => {
		const screen = await render(Harness, { direction: "vertical" });
		const h = handles(screen.container)[0];
		h.focus();
		await userEvent.keyboard("{ArrowDown}");
		expect(h.getAttribute("aria-valuenow")).toBe("51");
		await userEvent.keyboard("{ArrowUp}{ArrowUp}");
		expect(h.getAttribute("aria-valuenow")).toBe("49");
		await userEvent.keyboard("{ArrowRight}");
		expect(h.getAttribute("aria-valuenow")).toBe("49");
	});

	it("Home and End snap to the min and max, and clamp", async () => {
		const screen = await render(Harness, { min: 20, max: 80 });
		const h = handles(screen.container)[0];
		h.focus();
		await userEvent.keyboard("{End}");
		expect(h.getAttribute("aria-valuenow")).toBe("80");
		await userEvent.keyboard("{ArrowRight}");
		expect(h.getAttribute("aria-valuenow")).toBe("80");
		await userEvent.keyboard("{Home}");
		expect(h.getAttribute("aria-valuenow")).toBe("20");
		await userEvent.keyboard("{ArrowLeft}");
		expect(h.getAttribute("aria-valuenow")).toBe("20");
		const [a, b] = widths(screen.container);
		expect(Math.abs(a / (a + b) - 0.2)).toBeLessThan(0.02);
	});

	it("with three panels a handle only trades with its neighbours", async () => {
		const screen = await render(Harness, { three: true, min: 10, max: 90 });
		const [h1, h2] = handles(screen.container);
		h2.focus();
		await userEvent.keyboard("{ArrowRight}{ArrowRight}");
		expect(h2.getAttribute("aria-valuenow")).toBe("52");
		expect(h1.getAttribute("aria-valuenow")).toBe("25");
		const w = widths(screen.container);
		expect(Math.abs(w[0] / 600 - 0.25)).toBeLessThan(0.02);
		expect(Math.abs(w[2] / 600 - 0.23)).toBeLessThan(0.02);
	});

	it("a neighbour's min stops the handle before its own max", async () => {
		const screen = await render(Harness, { min: 40, max: 90 });
		const h = handles(screen.container)[0];
		h.focus();
		await userEvent.keyboard("{End}");
		expect(h.getAttribute("aria-valuenow")).toBe("60");
	});
});

describe("ResizablePanels pointer", () => {
	const fire = (el: HTMLElement, type: string, x: number, y: number) =>
		el.dispatchEvent(
			new PointerEvent(type, { button: 0, pointerId: 1, clientX: x, clientY: y, bubbles: true })
		);

	it("dragging a handle resizes and reports the layout once released", async () => {
		const onlayout = vi.fn();
		const screen = await render(Harness, { onlayout });
		const h = handles(screen.container)[0];
		const r = h.getBoundingClientRect();
		const y = r.y + 40;
		fire(h, "pointerdown", r.x + 1, y);
		fire(h, "pointermove", r.x + 61, y);
		await expect.poll(() => h.getAttribute("aria-valuenow")).toBe("60");
		expect(onlayout).not.toHaveBeenCalled();
		fire(h, "pointerup", r.x + 61, y);
		expect(onlayout).toHaveBeenLastCalledWith([60, 40]);
	});

	it("dragging past the limit clamps at the max", async () => {
		const screen = await render(Harness, { max: 70 });
		const h = handles(screen.container)[0];
		const r = h.getBoundingClientRect();
		fire(h, "pointerdown", r.x + 1, r.y + 40);
		fire(h, "pointermove", r.x + 400, r.y + 40);
		await expect.poll(() => h.getAttribute("aria-valuenow")).toBe("70");
		fire(h, "pointerup", r.x + 400, r.y + 40);
	});

	it("a cancelled drag puts the size back", async () => {
		const screen = await render(Harness, {});
		const h = handles(screen.container)[0];
		const r = h.getBoundingClientRect();
		fire(h, "pointerdown", r.x + 1, r.y + 40);
		fire(h, "pointermove", r.x + 91, r.y + 40);
		await expect.poll(() => h.getAttribute("aria-valuenow")).toBe("65");
		fire(h, "pointercancel", r.x + 91, r.y + 40);
		await expect.poll(() => h.getAttribute("aria-valuenow")).toBe("50");
	});
});

describe("ResizablePanels persist", () => {
	it("saves the layout under the key and restores it on the next mount", async () => {
		const first = await render(Harness, { persist: "ca-test-layout" });
		const h = handles(first.container)[0];
		h.focus();
		await userEvent.keyboard("{Shift>}{ArrowLeft}{/Shift}");
		expect(JSON.parse(localStorage.getItem("ca-test-layout") ?? "null")).toEqual({ a: 40, b: 60 });
		first.unmount();

		const second = await render(Harness, { persist: "ca-test-layout" });
		expect(handles(second.container)[0].getAttribute("aria-valuenow")).toBe("40");
		const [a, b] = widths(second.container);
		expect(Math.abs(a / (a + b) - 0.4)).toBeLessThan(0.02);
		expect(await checkA11y(second.container)).toHaveNoViolations();
	});

	it("ignores a stored layout that does not match the panels", async () => {
		localStorage.setItem("ca-test-layout", JSON.stringify({ a: 10, z: 90 }));
		const screen = await render(Harness, { persist: "ca-test-layout" });
		expect(handles(screen.container)[0].getAttribute("aria-valuenow")).toBe("50");
	});

	it("does not touch storage without persist", async () => {
		const screen = await render(Harness, {});
		handles(screen.container)[0].focus();
		await userEvent.keyboard("{ArrowRight}");
		expect(localStorage.length).toBe(0);
	});
});
