import { CalendarDate } from "@internationalized/date";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { cdp, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { touchTarget } from "../../../../tests/touch-target";
import { setLocale } from "../../i18n/index.js";
import CalendarFillHarness from "./CalendarFillHarness.test.svelte";
import DateHarness from "./DateHarness.test.svelte";

// These tests assert the Portuguese wording of the catalog.
beforeAll(() => setLocale("pt-BR"));
afterAll(() => setLocale("en"));

describe("Calendar", () => {
	it("renders pt-BR month, weekday names and Portuguese nav labels; passes axe", async () => {
		const screen = await render(DateHarness, { kind: "calendar" });
		await expect
			.element(screen.getByRole("application", { name: "Data março de 2026" }))
			.toBeVisible();
		await expect.element(screen.getByRole("button", { name: "Mês anterior" })).toBeVisible();
		await expect.element(screen.getByRole("button", { name: "Próximo mês" })).toBeVisible();
		await expect.element(screen.getByRole("gridcell", { name: "seg.", exact: true })).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("week starts on Monday by default and on Sunday when configured", async () => {
		const mon = await render(DateHarness, { kind: "calendar" });
		const first =
			mon.container.querySelector(".ca-cal__head-cell")?.textContent?.toLowerCase() ?? "";
		expect(first.startsWith("seg")).toBe(true);
		mon.unmount();
		const sun = await render(DateHarness, { kind: "calendar", weekStartsOn: 0 });
		expect(
			sun.container
				.querySelector(".ca-cal__head-cell")
				?.textContent?.toLowerCase()
				.startsWith("dom")
		).toBe(true);
	});

	it("clicking a day selects it", async () => {
		const screen = await render(DateHarness, { kind: "calendar" });
		await screen.getByRole("button", { name: /, 15 de março/ }).click();
		await expect.element(screen.getByTestId("date")).toHaveTextContent("2026-03-15");
	});

	it("arrow keys move focus and Enter selects", async () => {
		const onchange = vi.fn();
		const screen = await render(DateHarness, {
			kind: "calendar",
			onchange,
			date: new CalendarDate(2026, 3, 10),
		});
		const ten = screen.getByRole("button", { name: /, 10 de março/ });
		(ten.element() as HTMLElement).focus();
		await userEvent.keyboard("{ArrowRight}");
		await expect.element(screen.getByRole("button", { name: /, 11 de março/ })).toHaveFocus();
		await userEvent.keyboard("{ArrowDown}");
		await expect.element(screen.getByRole("button", { name: /, 18 de março/ })).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		await expect.element(screen.getByTestId("date")).toHaveTextContent("2026-03-18");
		expect(onchange).toHaveBeenCalledOnce();
	});

	it("selected day is exposed via aria-selected / data-selected", async () => {
		const screen = await render(DateHarness, {
			kind: "calendar",
			date: new CalendarDate(2026, 3, 12),
		});
		const cell = screen.getByRole("gridcell", { name: /, 12 de março/ });
		await expect.element(cell).toHaveAttribute("aria-selected", "true");
	});

	it("next/previous month buttons change the visible month", async () => {
		const screen = await render(DateHarness, { kind: "calendar" });
		await screen.getByRole("button", { name: "Próximo mês" }).click();
		await expect
			.element(screen.getByRole("application", { name: "Data abril de 2026" }))
			.toBeVisible();
		await screen.getByRole("button", { name: "Mês anterior" }).click();
		await screen.getByRole("button", { name: "Mês anterior" }).click();
		await expect
			.element(screen.getByRole("application", { name: "Data fevereiro de 2026" }))
			.toBeVisible();
	});

	it("minValue blocks earlier days", async () => {
		const screen = await render(DateHarness, {
			kind: "calendar",
			minValue: new CalendarDate(2026, 3, 10),
		});
		const before = screen.getByRole("button", { name: /, 5 de março/ });
		await expect.element(before).toHaveAttribute("aria-disabled", "true");
		await before.click({ force: true });
		await expect.element(screen.getByTestId("date")).toHaveTextContent("");
		await screen.getByRole("button", { name: /, 10 de março/ }).click();
		await expect.element(screen.getByTestId("date")).toHaveTextContent("2026-03-10");
	});

	it("minValue disables the previous-month button at the boundary", async () => {
		const screen = await render(DateHarness, {
			kind: "calendar",
			minValue: new CalendarDate(2026, 3, 1),
		});
		await expect
			.element(screen.getByRole("button", { name: "Mês anterior" }))
			.toHaveAttribute("aria-disabled", "true");
	});

	it("isDateUnavailable marks days unavailable and blocks selection", async () => {
		const screen = await render(DateHarness, {
			kind: "calendar",
			isDateUnavailable: (d: CalendarDate) => d.day === 20,
		});
		const day = screen.getByRole("button", { name: /, 20 de março/ });
		await expect.element(day).toHaveAttribute("data-unavailable");
		await day.click({ force: true });
		await expect.element(screen.getByTestId("date")).toHaveTextContent("");
	});

	it("disabled calendar ignores clicks", async () => {
		const screen = await render(DateHarness, { kind: "calendar", disabled: true });
		await screen.getByRole("button", { name: /, 15 de março/ }).click({ force: true });
		await expect.element(screen.getByTestId("date")).toHaveTextContent("");
	});
});

// #1230: `fill` makes a standalone calendar take its container's width; the seven columns (and the
// months of a RangeCalendar) share it and a day keeps its square size, centred in its column.
describe("Calendar fill", () => {
	const box = (el: Element) => el.getBoundingClientRect();
	const centre = (el: Element) => box(el).left + box(el).width / 2;

	async function inHost(props: {
		width: number;
		fill?: boolean;
		range?: boolean;
		numberOfMonths?: number;
	}) {
		const screen = await render(CalendarFillHarness, props);
		const host = screen.getByTestId("host").element() as HTMLElement;
		const cal = host.querySelector(".ca-cal") as HTMLElement;
		const months = cal.querySelector(".ca-cal__months") as HTMLElement;
		return { screen, host, cal, months };
	}

	it("296px coarse: fills, days touch-sized", async () => {
		await cdp().send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
		try {
			const { host, cal, months } = await inHost({ width: 296, fill: true });
			expect(matchMedia("(pointer: coarse)").matches).toBe(true);
			expect(Math.abs(box(cal).width - box(host).width)).toBeLessThanOrEqual(0.5);
			for (const el of [host, cal, months])
				expect(el.scrollWidth, el.className).toBeLessThanOrEqual(el.clientWidth);
			const days = [...cal.querySelectorAll<HTMLElement>("[data-ca-day]")];
			expect(days.length).toBeGreaterThanOrEqual(28);
			for (const d of days) {
				expect(box(d).height, d.dataset.value).toBeGreaterThanOrEqual(touchTarget());
				expect(box(d).width, d.dataset.value).toBeLessThanOrEqual(touchTarget());
				expect(box(d).right, d.dataset.value).toBeLessThanOrEqual(box(months).right + 0.5);
			}
		} finally {
			await cdp().send("Emulation.setTouchEmulationEnabled", { enabled: false });
		}
	});

	it("768px: fills with 7 equal columns", async () => {
		const { host, cal, months } = await inHost({ width: 768, fill: true });
		expect(Math.abs(box(cal).width - box(host).width)).toBeLessThanOrEqual(0.5);
		const cols = [...cal.querySelectorAll(".ca-cal__head-cell")].map((th) => box(th).width);
		expect(cols).toHaveLength(7);
		for (const w of cols) expect(Math.abs(w - cols[0])).toBeLessThanOrEqual(1);
		// The columns span the month, which spans the calendar's content box.
		expect(Math.abs(cols.reduce((a, b) => a + b) - box(months).width)).toBeLessThanOrEqual(1);
		// A day stays square (no pill) and sits in the middle of its column.
		const day = cal.querySelector('[data-ca-day][data-value="2026-03-11"]') as HTMLElement;
		expect(Math.abs(box(day).width - box(day).height)).toBeLessThanOrEqual(1);
		expect(Math.abs(centre(day) - centre(day.closest("td") as HTMLElement))).toBeLessThanOrEqual(1);
	});

	it("without fill: keeps its own width", async () => {
		const narrow = await inHost({ width: 768 });
		const own = box(narrow.cal).width;
		narrow.screen.unmount();
		const wide = await inHost({ width: 1000 });
		expect(own).toBeLessThan(768 / 2);
		expect(Math.abs(box(wide.cal).width - own)).toBeLessThanOrEqual(0.5);
	});

	it("range: 2 months share a 768px host", async () => {
		const { host, cal, months } = await inHost({
			width: 768,
			fill: true,
			range: true,
			numberOfMonths: 2,
		});
		expect(Math.abs(box(cal).width - box(host).width)).toBeLessThanOrEqual(0.5);
		const [a, b] = [...cal.querySelectorAll(".ca-cal__grid")].map(box);
		expect(Math.abs(a.width - b.width)).toBeLessThanOrEqual(1);
		expect(Math.abs(a.top - b.top)).toBeLessThanOrEqual(0.5);
		expect(Math.abs(b.right - a.left - box(months).width)).toBeLessThanOrEqual(1);
	});

	it("range: 2 months stack in a 296px host", async () => {
		const { host, cal, months } = await inHost({
			width: 296,
			fill: true,
			range: true,
			numberOfMonths: 2,
		});
		expect(Math.abs(box(cal).width - box(host).width)).toBeLessThanOrEqual(0.5);
		expect(months.scrollWidth).toBeLessThanOrEqual(months.clientWidth);
		const [a, b] = [...cal.querySelectorAll(".ca-cal__grid")].map(box);
		expect(b.top).toBeGreaterThanOrEqual(a.bottom);
		for (const g of [a, b]) expect(Math.abs(g.width - box(months).width)).toBeLessThanOrEqual(1);
	});

	it("fill passes axe", async () => {
		const { screen } = await inHost({ width: 768, fill: true });
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});
