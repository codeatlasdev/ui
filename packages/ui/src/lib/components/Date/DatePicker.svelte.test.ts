import { CalendarDate } from "@internationalized/date";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cdp, page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import { touchTarget } from "../../../../tests/touch-target";
import { setLocale } from "../../i18n/index.js";
import DateHarness from "./DateHarness.test.svelte";
import DatePickerScrollHarness from "./DatePickerScrollHarness.test.svelte";

// These tests assert the Portuguese wording of the catalog.
beforeAll(() => setLocale("pt-BR"));
afterAll(() => setLocale("en"));

describe("DatePicker", () => {
	it("closed: labelled group with pt-BR segments and a calendar trigger; passes axe", async () => {
		const screen = await render(DateHarness, { kind: "picker" });
		await expect.element(screen.getByRole("group", { name: "Date" })).toBeVisible();
		expect(
			screen
				.getByRole("spinbutton")
				.elements()
				.map((s) => s.textContent)
		).toEqual(["dd", "mm", "aaaa"]);
		await expect
			.element(screen.getByRole("button", { name: "Abrir calendário" }))
			.toHaveAttribute("aria-expanded", "false");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("trigger opens the calendar dialog in pt-BR; passes axe open", async () => {
		const screen = await render(DateHarness, { kind: "picker" });
		await screen.getByRole("button", { name: "Abrir calendário" }).click();
		const dialog = page.getByRole("dialog");
		await expect.element(dialog).toBeVisible();
		await expect.element(dialog.getByText("março de 2026").first()).toBeVisible();
		await expect.element(dialog.getByRole("button", { name: "Próximo mês" })).toBeVisible();
		await settled();
		expect(
			await checkA11y(document.querySelector('[role="dialog"]') as HTMLElement)
		).toHaveNoViolations();
		void screen;
	});

	it("picking a day sets the value, fills the segments and closes the popover", async () => {
		const screen = await render(DateHarness, { kind: "picker" });
		await screen.getByRole("button", { name: "Abrir calendário" }).click();
		await page.getByRole("button", { name: /, 15 de março/ }).click();
		await expect.element(screen.getByTestId("date")).toHaveTextContent("2026-03-15");
		await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
		expect(
			screen
				.getByRole("spinbutton")
				.elements()
				.map((s) => s.textContent)
		).toEqual(["15", "03", "2026"]);
	});

	it("keyboard: Enter on the trigger opens, arrows + Enter select, Escape closes", async () => {
		const screen = await render(DateHarness, {
			kind: "picker",
			date: new CalendarDate(2026, 3, 10),
		});
		const trigger = screen.getByRole("button", { name: "Abrir calendário" });
		(trigger.element() as HTMLElement).focus();
		await userEvent.keyboard("{Enter}");
		await expect.element(page.getByRole("dialog")).toBeVisible();
		await expect
			.poll(() => document.activeElement?.getAttribute("aria-label") ?? "")
			.toMatch(/, 10 de março/);
		await userEvent.keyboard("{ArrowRight}{ArrowRight}{Enter}");
		await expect.element(screen.getByTestId("date")).toHaveTextContent("2026-03-12");
		await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();

		await userEvent.keyboard("{Enter}");
		await expect.element(page.getByRole("dialog")).toBeVisible();
		await userEvent.keyboard("{Escape}");
		await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
		await expect.element(trigger).toHaveFocus();
	});

	it("minValue blocks earlier days in the popover", async () => {
		const screen = await render(DateHarness, {
			kind: "picker",
			minValue: new CalendarDate(2026, 3, 10),
		});
		await screen.getByRole("button", { name: "Abrir calendário" }).click();
		const before = page.getByRole("button", { name: /, 5 de março/ });
		await expect.element(before).toHaveAttribute("aria-disabled", "true");
		await before.click({ force: true });
		await expect.element(screen.getByTestId("date")).toHaveTextContent("");
	});

	it("typing into the segments updates the value", async () => {
		const screen = await render(DateHarness, { kind: "picker" });
		(screen.getByRole("spinbutton").first().element() as HTMLElement).focus();
		await userEvent.keyboard("01022026");
		await expect.element(screen.getByTestId("date")).toHaveTextContent("2026-02-01");
	});

	it("error is a role=alert referenced by the group; disabled blocks the trigger", async () => {
		const err = await render(DateHarness, { kind: "picker", error: "Required" });
		const alert = err.getByRole("alert");
		await expect.element(alert).toMatchTextContent("Required");
		expect(
			err.getByRole("group", { name: "Date" }).element().getAttribute("aria-describedby")
		).toBe(alert.element().id);
		expect(await checkA11y(err.container)).toHaveNoViolations();
		err.unmount();

		const dis = await render(DateHarness, { kind: "picker", disabled: true });
		await expect.element(dis.getByRole("button", { name: "Abrir calendário" })).toBeDisabled();
	});

	it("custom triggerLabel is the button name", async () => {
		const screen = await render(DateHarness, { kind: "picker", triggerLabel: "Pick a date" });
		await expect.element(screen.getByRole("button", { name: "Pick a date" })).toBeVisible();
	});
});

describe("DatePicker next to other calendars on the page", () => {
	it("opening focuses its own day without scrolling", async () => {
		const screen = await render(DatePickerScrollHarness, {});
		window.scrollTo(0, 0);
		await screen.getByRole("button", { name: "Abrir calendário" }).click();
		const dialog = page.getByRole("dialog");
		await expect.element(dialog).toBeVisible();
		await expect.poll(() => dialog.element().contains(document.activeElement)).toBe(true);
		expect(window.scrollY).toBe(0);
		const rect = (dialog.element() as HTMLElement).getBoundingClientRect();
		expect(rect.top).toBeGreaterThanOrEqual(0);
		expect(rect.bottom).toBeLessThanOrEqual(window.innerHeight);
	});

	it("popover keys drive only the picker", async () => {
		const screen = await render(DatePickerScrollHarness, {});
		await screen.getByRole("button", { name: "Abrir calendário" }).click();
		await expect
			.poll(() => page.getByRole("dialog").element().contains(document.activeElement))
			.toBe(true);
		await userEvent.keyboard("{ArrowRight}{Enter}");
		await expect.element(screen.getByTestId("picker")).toHaveTextContent("2026-03-11");
		await expect.element(screen.getByTestId("cal")).toHaveTextContent("2026-10-10");
	});
	// #1210: an optional date filter ("all dates") needs a way back to no date after one was picked.
	describe("clearable (#1210)", () => {
		it("clears the value", async () => {
			const changes: unknown[] = [];
			const screen = await render(DateHarness, {
				kind: "picker",
				date: new CalendarDate(2026, 3, 12),
				clearable: true,
				onchange: (v: unknown) => changes.push(v),
			});
			const clear = screen.getByRole("button", { name: "Limpar data" });
			await clear.click();
			await expect.element(screen.getByTestId("date")).toHaveTextContent("");
			expect(changes).toEqual([undefined]);
			const texts = screen
				.getByRole("spinbutton")
				.elements()
				.map((el) => el.textContent);
			expect(texts).toEqual(["dd", "mm", "aaaa"]);
			expect(screen.container.querySelector(".ca-date__clear")).toBeNull();
			await expect.element(screen.getByRole("button", { name: "Abrir calendário" })).toHaveFocus();
			expect(await checkA11y(screen.container)).toHaveNoViolations();
		});

		it("no button off or empty", async () => {
			const off = await render(DateHarness, {
				kind: "picker",
				date: new CalendarDate(2026, 3, 12),
			});
			expect(off.container.querySelector(".ca-date__clear")).toBeNull();
			off.unmount();
			const empty = await render(DateHarness, { kind: "picker", clearable: true });
			expect(empty.container.querySelector(".ca-date__clear")).toBeNull();
		});

		it("range clears both", async () => {
			const changes: unknown[] = [];
			const screen = await render(DateHarness, {
				kind: "rangepicker",
				range: { start: new CalendarDate(2026, 3, 2), end: new CalendarDate(2026, 3, 9) },
				clearable: true,
				onchange: (v: unknown) => changes.push(v),
			});
			await screen.getByRole("button", { name: "Limpar datas" }).click();
			await expect.element(screen.getByTestId("start")).toHaveTextContent("");
			expect(changes).toEqual([{ start: undefined, end: undefined }]);
		});

		it("phone: name, 44px", async () => {
			await page.viewport(390, 844);
			await cdp().send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
			try {
				const screen = await render(DateHarness, {
					kind: "picker",
					date: new CalendarDate(2026, 3, 12),
					clearable: true,
					triggerLabel: "Escolher a data do filtro",
				});
				await expect
					.element(screen.getByRole("button", { name: "Escolher a data do filtro" }))
					.toBeVisible();
				const clear = screen.getByRole("button", { name: "Limpar data" }).element();
				const r = clear.getBoundingClientRect();
				const a = getComputedStyle(clear, "::after");
				const w = Math.max(r.width, Number.parseFloat(a.width) || 0);
				const h = Math.max(r.height, Number.parseFloat(a.height) || 0);
				expect(Math.min(w, h)).toBeGreaterThanOrEqual(touchTarget());
			} finally {
				await cdp().send("Emulation.setTouchEmulationEnabled", { enabled: false });
			}
		});
	});
});
