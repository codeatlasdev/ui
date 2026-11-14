import { CalendarDate } from "@internationalized/date";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import { setLocale } from "../../i18n/index.js";
import DateHarness from "./DateHarness.test.svelte";
import DatePickerScrollHarness from "./DatePickerScrollHarness.test.svelte";

// These tests assert the Portuguese wording of the catalog.
beforeAll(() => setLocale("pt-BR"));
afterAll(() => setLocale("en"));

describe("DateRangePicker", () => {
	it("closed: labelled group with start and end segments and a trigger; passes axe", async () => {
		const screen = await render(DateHarness, { kind: "rangepicker" });
		await expect.element(screen.getByRole("group", { name: "Period" })).toBeVisible();
		expect(screen.getByRole("spinbutton").elements()).toHaveLength(6);
		await expect.element(screen.getByRole("button", { name: "Abrir calendário" })).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("trigger opens a two-month pt-BR calendar; passes axe open", async () => {
		const screen = await render(DateHarness, { kind: "rangepicker" });
		await screen.getByRole("button", { name: "Abrir calendário" }).click();
		const dialog = page.getByRole("dialog");
		await expect.element(dialog).toBeVisible();
		expect(dialog.getByRole("grid").elements()).toHaveLength(2);
		await settled();
		expect(
			await checkA11y(document.querySelector('[role="dialog"]') as HTMLElement)
		).toHaveNoViolations();
		void screen;
	});

	it("choosing start then end sets the range and closes the popover", async () => {
		const screen = await render(DateHarness, { kind: "rangepicker" });
		await screen.getByRole("button", { name: "Abrir calendário" }).click();
		await page.getByRole("button", { name: /, 5 de março/ }).click();
		await page.getByRole("button", { name: /, 12 de março/ }).click();
		await expect.element(screen.getByTestId("start")).toHaveTextContent("2026-03-05");
		await expect.element(screen.getByTestId("end")).toHaveTextContent("2026-03-12");
		await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
		const texts = screen
			.getByRole("spinbutton")
			.elements()
			.map((s) => s.textContent);
		expect(texts).toEqual(["05", "03", "2026", "12", "03", "2026"]);
	});

	it("keyboard: open, arrows + Enter pick both ends, Escape closes an open picker", async () => {
		const screen = await render(DateHarness, { kind: "rangepicker" });
		const trigger = screen.getByRole("button", { name: "Abrir calendário" });
		(trigger.element() as HTMLElement).focus();
		await userEvent.keyboard("{Enter}");
		await expect.element(page.getByRole("dialog")).toBeVisible();
		await expect
			.poll(() => document.activeElement?.getAttribute("aria-label") ?? "")
			.toMatch(/de março/);
		await userEvent.keyboard("{Enter}");
		await userEvent.keyboard("{ArrowRight}{ArrowRight}{Enter}");
		await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
		const start = screen.getByTestId("start").element().textContent ?? "";
		const end = screen.getByTestId("end").element().textContent ?? "";
		expect(start).not.toBe("");
		expect(
			new CalendarDate(+end.slice(0, 4), +end.slice(5, 7), +end.slice(8)).compare(
				new CalendarDate(+start.slice(0, 4), +start.slice(5, 7), +start.slice(8))
			)
		).toBe(2);

		await userEvent.keyboard("{Enter}");
		await expect.element(page.getByRole("dialog")).toBeVisible();
		await userEvent.keyboard("{Escape}");
		await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
	});

	it("minValue blocks earlier days", async () => {
		const screen = await render(DateHarness, {
			kind: "rangepicker",
			minValue: new CalendarDate(2026, 3, 10),
		});
		await screen.getByRole("button", { name: "Abrir calendário" }).click();
		const before = page.getByRole("button", { name: /, 5 de março/ });
		await expect.element(before).toHaveAttribute("aria-disabled", "true");
		await before.click({ force: true });
		await expect.element(screen.getByTestId("start")).toHaveTextContent("");
	});

	it("error is a role=alert referenced by the group", async () => {
		const screen = await render(DateHarness, { kind: "rangepicker", error: "Invalid period" });
		const alert = screen.getByRole("alert");
		await expect.element(alert).toMatchTextContent("Invalid period");
		expect(
			screen.getByRole("group", { name: "Period" }).element().getAttribute("aria-describedby")
		).toBe(alert.element().id);
	});
});

// #1139: preset ranges in the popover, counted from a fixed `today` (never the real clock).
const TODAY = new CalendarDate(2026, 3, 15);
const iso = (r: { start?: unknown; end?: unknown }) => `${r.start}/${r.end}`;
const presetNames = () =>
	page
		.getByRole("group", { name: "Períodos rápidos" })
		.getByRole("button")
		.elements()
		.map((b) => b.textContent?.trim());

describe("DateRangePicker presets", () => {
	it("lists pt-BR presets; passes axe open", async () => {
		const screen = await render(DateHarness, { kind: "rangepicker", presets: true, today: TODAY });
		await screen.getByRole("button", { name: "Abrir calendário" }).click();
		await expect.element(page.getByRole("group", { name: "Períodos rápidos" })).toBeVisible();
		expect(presetNames()).toEqual([
			"Hoje",
			"Últimos 7 dias",
			"Últimos 30 dias",
			"Este mês",
			"Mês passado",
		]);
		await settled();
		expect(
			await checkA11y(document.querySelector('[role="dialog"]') as HTMLElement)
		).toHaveNoViolations();
	});

	it("Este mês runs from day 1 to the last day", async () => {
		const screen = await render(DateHarness, { kind: "rangepicker", presets: true, today: TODAY });
		await screen.getByRole("button", { name: "Abrir calendário" }).click();
		await page.getByRole("button", { name: "Este mês", exact: true }).click();
		await expect.element(screen.getByTestId("start")).toHaveTextContent("2026-03-01");
		await expect.element(screen.getByTestId("end")).toHaveTextContent("2026-03-31");
		await screen.getByRole("button", { name: "Abrir calendário" }).click();
		await page.getByRole("button", { name: "Mês passado", exact: true }).click();
		await expect.element(screen.getByTestId("start")).toHaveTextContent("2026-02-01");
		await expect.element(screen.getByTestId("end")).toHaveTextContent("2026-02-28");
	});

	it("marks the preset that matches the value", async () => {
		const screen = await render(DateHarness, {
			kind: "rangepicker",
			presets: true,
			today: TODAY,
			range: { start: new CalendarDate(2026, 3, 9), end: new CalendarDate(2026, 3, 15) },
		});
		await screen.getByRole("button", { name: "Abrir calendário" }).click();
		const pressed = (name: string) =>
			page.getByRole("button", { name, exact: true }).element().getAttribute("aria-pressed");
		await expect.element(page.getByRole("button", { name: "Últimos 7 dias" })).toBeVisible();
		expect(pressed("Últimos 7 dias")).toBe("true");
		expect(pressed("Hoje")).toBe("false");
		await page.getByRole("button", { name: "Hoje", exact: true }).click();
		await screen.getByRole("button", { name: "Abrir calendário" }).click();
		await expect.poll(() => pressed("Hoje")).toBe("true");
		expect(pressed("Últimos 7 dias")).toBe("false");
	});

	it("today follows the timeZone prop", async () => {
		// 12:00 UTC is already the 16th at UTC+14 and still the 15th at UTC-11.
		vi.useFakeTimers({ toFake: ["Date"] });
		vi.setSystemTime(new Date("2026-03-15T12:00:00Z"));
		try {
			const screen = await render(DateHarness, {
				kind: "rangepicker",
				presets: true,
				timeZone: "Pacific/Kiritimati",
			});
			await screen.getByRole("button", { name: "Abrir calendário" }).click();
			await page.getByRole("button", { name: "Hoje", exact: true }).click();
			await expect.element(screen.getByTestId("start")).toHaveTextContent("2026-03-16");
			await expect.element(screen.getByTestId("end")).toHaveTextContent("2026-03-16");
		} finally {
			vi.useRealTimers();
		}
	});

	it("clamps to min/max and disables a range outside", async () => {
		const screen = await render(DateHarness, {
			kind: "rangepicker",
			presets: true,
			today: TODAY,
			minValue: new CalendarDate(2026, 3, 5),
			maxValue: TODAY,
		});
		await screen.getByRole("button", { name: "Abrir calendário" }).click();
		await expect
			.element(page.getByRole("button", { name: "Mês passado", exact: true }))
			.toBeDisabled();
		await page.getByRole("button", { name: "Este mês", exact: true }).click();
		await expect.element(screen.getByTestId("start")).toHaveTextContent("2026-03-05");
		await expect.element(screen.getByTestId("end")).toHaveTextContent("2026-03-15");
	});

	it("keyboard: Shift+Tab reaches a preset, Enter picks it", async () => {
		const screen = await render(DateHarness, { kind: "rangepicker", presets: true, today: TODAY });
		const trigger = screen.getByRole("button", { name: "Abrir calendário" });
		(trigger.element() as HTMLElement).focus();
		await userEvent.keyboard("{Enter}");
		await expect
			.poll(() => document.activeElement?.getAttribute("aria-label") ?? "")
			.toMatch(/de março/);
		// day → next month → previous month → last preset
		await userEvent.keyboard("{Shift>}{Tab}{Tab}{Tab}{/Shift}");
		expect(document.activeElement?.textContent?.trim()).toBe("Mês passado");
		await userEvent.keyboard("{Enter}");
		await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
		await expect.element(screen.getByTestId("start")).toHaveTextContent("2026-02-01");
		expect(document.activeElement).toBe(trigger.element());
	});
});

describe("DateRangePicker presets, en", () => {
	beforeAll(() => setLocale("en"));
	afterAll(() => setLocale("pt-BR"));

	it("Last 7 days sets the range, reports once, closes", async () => {
		const onchange = vi.fn();
		const screen = await render(DateHarness, {
			kind: "rangepicker",
			presets: true,
			today: TODAY,
			onchange,
		});
		await screen.getByRole("button", { name: "Open calendar" }).click();
		await expect.element(page.getByRole("group", { name: "Quick ranges" })).toBeVisible();
		await page.getByRole("button", { name: "Last 7 days", exact: true }).click();
		await expect.element(screen.getByTestId("start")).toHaveTextContent("2026-03-09");
		await expect.element(screen.getByTestId("end")).toHaveTextContent("2026-03-15");
		expect(onchange).toHaveBeenCalledTimes(1);
		expect(iso(onchange.mock.calls[0][0])).toBe("2026-03-09/2026-03-15");
		await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
		expect(document.activeElement).toBe(
			screen.getByRole("button", { name: "Open calendar" }).element()
		);
	});

	it("custom presets: a function of today and built-in ids", async () => {
		const screen = await render(DateHarness, {
			kind: "rangepicker",
			today: TODAY,
			presets: [
				{
					label: "Year to date",
					range: (today: CalendarDate) => ({ start: today.set({ month: 1, day: 1 }), end: today }),
				},
				"last90Days",
			],
		});
		await screen.getByRole("button", { name: "Open calendar" }).click();
		const group = page.getByRole("group", { name: "Quick ranges" });
		await expect.element(group).toBeVisible();
		expect(
			group
				.getByRole("button")
				.elements()
				.map((b) => b.textContent?.trim())
		).toEqual(["Year to date", "Last 90 days"]);
		await page.getByRole("button", { name: "Year to date", exact: true }).click();
		await expect.element(screen.getByTestId("start")).toHaveTextContent("2026-01-01");
		await expect.element(screen.getByTestId("end")).toHaveTextContent("2026-03-15");
		await screen.getByRole("button", { name: "Open calendar" }).click();
		await page.getByRole("button", { name: "Last 90 days", exact: true }).click();
		await expect.element(screen.getByTestId("start")).toHaveTextContent("2025-12-16");
	});
});

describe("DateRangePicker next to other calendars on the page", () => {
	it("opening focuses its own day without scrolling", async () => {
		const screen = await render(DatePickerScrollHarness, { range: true });
		window.scrollTo(0, 0);
		await screen.getByRole("button", { name: "Abrir calendário" }).click();
		const dialog = page.getByRole("dialog");
		await expect.element(dialog).toBeVisible();
		await expect.poll(() => dialog.element().contains(document.activeElement)).toBe(true);
		expect(window.scrollY).toBe(0);
	});

	it("popover keys drive only the range picker", async () => {
		const screen = await render(DatePickerScrollHarness, { range: true });
		await screen.getByRole("button", { name: "Abrir calendário" }).click();
		await expect
			.poll(() => page.getByRole("dialog").element().contains(document.activeElement))
			.toBe(true);
		await userEvent.keyboard("{Enter}{ArrowRight}{Enter}");
		await expect.element(screen.getByTestId("rstart")).toHaveTextContent("2026-03-10");
		await expect.element(screen.getByTestId("rend")).toHaveTextContent("2026-03-11");
		await expect.element(screen.getByTestId("cal")).toHaveTextContent("2026-10-10");
	});
});
