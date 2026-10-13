import { CalendarDate } from "@internationalized/date";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
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
