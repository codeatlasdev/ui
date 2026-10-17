import { describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { VIEWPORTS } from "../../../../tests/viewports";
import LocaleHarness from "./DataTableV2.locale.test.svelte";
import Harness from "./DataTableV2.test.svelte";

const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)));
const key = async (el: Element, k: string, init: KeyboardEventInit = {}) => {
	el.dispatchEvent(
		new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init })
	);
	await frame();
};
const titles = (c: Element, group?: string) =>
	Array.from(
		c.querySelectorAll(group ? `tbody[data-group="${group}"] tr[data-row]` : "tbody tr[data-row]")
	).map((tr) => tr.querySelector("td:not(.ca-datatable__grip-cell)")?.textContent?.trim());
const grip = (c: Element, title: string) =>
	Array.from(c.querySelectorAll<HTMLElement>("button.ca-datatable__grip")).find((b) =>
		b.getAttribute("aria-label")?.includes(title)
	) as HTMLElement;
const live = () =>
	Array.from(document.querySelectorAll("[data-ca-announcer]"))
		.map((el) => el.textContent)
		.join("|");

describe("DataTable row groups", () => {
	it("renders one tbody per group with a collapsible header", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, { props: { reorder: false } });
		const bodies = screen.container.querySelectorAll("tbody[data-group]");
		expect(Array.from(bodies).map((b) => b.getAttribute("data-group"))).toEqual([
			"Backlog",
			"Sprint",
		]);
		const toggle = screen.getByRole("button", { name: /Backlog/ });
		await expect.element(toggle).toHaveAttribute("aria-expanded", "true");
		expect(titles(screen.container, "Backlog")).toEqual(["Task 1", "Task 2", "Task 3"]);
		await toggle.click();
		await expect.element(toggle).toHaveAttribute("aria-expanded", "false");
		expect(titles(screen.container, "Backlog")).toEqual([]);
		expect(titles(screen.container, "Sprint")).toHaveLength(3);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});

describe("DataTable column resize", () => {
	it("keyboard: arrows resize, Home resets, min/max clamp, aria-valuenow follows", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, { props: { reorder: false, groups: false } });
		const sep = screen.container.querySelector<HTMLElement>("[role=separator]") as HTMLElement;
		expect(sep.getAttribute("aria-orientation")).toBe("vertical");
		expect(sep.getAttribute("aria-valuenow")).toBe("240");
		expect(sep.getAttribute("aria-valuemin")).toBe("120");
		expect(sep.getAttribute("aria-valuemax")).toBe("480");
		sep.focus();
		await key(sep, "ArrowRight");
		expect(sep.getAttribute("aria-valuenow")).toBe("250");
		await key(sep, "ArrowRight", { shiftKey: true });
		expect(sep.getAttribute("aria-valuenow")).toBe("290");
		const th = sep.closest("th") as HTMLElement;
		expect(Math.round(th.getBoundingClientRect().width)).toBe(290);
		await key(sep, "End");
		expect(sep.getAttribute("aria-valuenow")).toBe("480");
		await key(sep, "ArrowRight");
		expect(sep.getAttribute("aria-valuenow")).toBe("480");
		await key(sep, "Home");
		expect(sep.getAttribute("aria-valuenow")).toBe("120");
		await key(sep, "Enter");
		expect(sep.getAttribute("aria-valuenow")).toBe("240");
	});

	it("pointer drag on the handle resizes the column", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, { props: { reorder: false, groups: false } });
		const sep = screen.container.querySelector<HTMLElement>("[role=separator]") as HTMLElement;
		const r = sep.getBoundingClientRect();
		const x = r.left + r.width / 2;
		const y = r.top + r.height / 2;
		const fire = (type: string, cx: number) =>
			(type === "pointerdown" ? sep : document).dispatchEvent(
				new PointerEvent(type, {
					bubbles: true,
					cancelable: true,
					clientX: cx,
					clientY: y,
					pointerId: 3,
					pointerType: "mouse",
					isPrimary: true,
					button: 0,
				})
			);
		fire("pointerdown", x);
		fire("pointermove", x + 60);
		await frame();
		expect(sep.getAttribute("aria-valuenow")).toBe("300");
		fire("pointerup", x + 60);
		await frame();
		fire("pointermove", x + 200);
		await frame();
		expect(sep.getAttribute("aria-valuenow")).toBe("300");
	});
});

describe("DataTable row reorder", () => {
	it("keyboard reorders inside a group and reports group + index", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const onReorder = vi.fn();
		const screen = await render(Harness, { props: { onReorder } });
		const c = screen.container;
		const g = grip(c, "Task 1");
		g.focus();
		await key(g, " ");
		await key(g, "ArrowDown");
		await key(g, "Enter");
		await vi.waitFor(() => expect(titles(c, "Backlog")).toEqual(["Task 2", "Task 1", "Task 3"]));
		expect(onReorder).toHaveBeenCalledWith({
			id: "t1",
			from: { group: "Backlog", index: 0 },
			to: { group: "Backlog", index: 1 },
		});
		await vi.waitFor(() => expect(live()).toContain("Dropped Task 1"));
	});

	it("keyboard moves a row to another group", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const onReorder = vi.fn();
		const screen = await render(Harness, { props: { onReorder } });
		const c = screen.container;
		const g = grip(c, "Task 2");
		g.focus();
		await key(g, " ");
		await key(g, "ArrowRight");
		await key(g, "Enter");
		await vi.waitFor(() => expect(titles(c, "Sprint")).toContain("Task 2"));
		expect(onReorder.mock.calls[0][0]).toMatchObject({
			id: "t2",
			from: { group: "Backlog" },
			to: { group: "Sprint" },
		});
		expect(titles(c, "Backlog")).not.toContain("Task 2");
	});

	it("exposes a named grip per row; no grips without onReorder", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const withGrips = await render(Harness, {});
		expect(withGrips.container.querySelectorAll("button.ca-datatable__grip")).toHaveLength(6);
		expect(grip(withGrips.container, "Task 3").getAttribute("aria-label")).toBe("Move Task 3");
		expect(await checkA11y(withGrips.container)).toHaveNoViolations();
		const without = await render(Harness, { props: { reorder: false } });
		expect(without.container.querySelectorAll("button.ca-datatable__grip")).toHaveLength(0);
	});
});

describe("DataTable interactive cells", () => {
	it("a control inside a cell does not fire onRowClick; the rest of the row does", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const onRowClick = vi.fn();
		const onEdit = vi.fn();
		const screen = await render(Harness, {
			props: { onRowClick, onEdit, reorder: false, groups: false },
		});
		await screen.getByRole("button", { name: "Edit Task 2" }).click();
		expect(onEdit).toHaveBeenCalledTimes(1);
		expect(onRowClick).not.toHaveBeenCalled();
		await screen.getByRole("cell", { name: "Task 3" }).click();
		expect(onRowClick).toHaveBeenCalledTimes(1);
	});
});

describe("DataTable a11y states", () => {
	it("axe is clean with grouped rows, grips and resize handles, also mid-drag and collapsed", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, {});
		expect(await checkA11y(screen.container)).toHaveNoViolations();
		const g = grip(screen.container, "Task 1");
		g.focus();
		await key(g, " ");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
		await key(g, "Escape");
		await screen.getByRole("button", { name: /Sprint/ }).click();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("the sortable header keeps aria-sort on its column header", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, { props: { reorder: false, groups: false } });
		const header = screen.getByRole("columnheader", { name: /Title/ });
		await screen.getByRole("button", { name: "Title" }).click();
		await expect.element(header).toHaveAttribute("aria-sort", "ascending");
	});
});

describe("DataTable labels", () => {
	it("grip and resize handle names follow the locale", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(LocaleHarness, { props: { locale: "pt-BR" } });
		expect(grip(screen.container, "Task 1").getAttribute("aria-label")).toBe("Mover Task 1");
		expect(screen.container.querySelector("[role=separator]")?.getAttribute("aria-label")).toBe(
			"Redimensionar Title"
		);
	});
});

describe("DataTable many rows", () => {
	it("renders only the current page of 1000 rows", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, {
			props: { rows: 1000, groups: false, reorder: false, pageSize: 50 },
		});
		expect(screen.container.querySelectorAll("tbody tr[data-row]")).toHaveLength(50);
		await expect.element(screen.getByText("1,000 results")).toBeInTheDocument();
	});
});
