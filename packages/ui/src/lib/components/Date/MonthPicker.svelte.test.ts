import { CalendarDate } from "@internationalized/date";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cdp, page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import { touchTarget } from "../../../../tests/touch-target";
import { setLocale } from "../../i18n/index.js";
import DateHarness from "./DateHarness.test.svelte";

// These tests assert the Portuguese wording of the catalog.
beforeAll(() => setLocale("pt-BR"));
afterAll(() => setLocale("en"));

const OPEN = "Escolher mês";

describe("MonthPicker", () => {
	it("closed: labelled group showing month and year, a trigger; passes axe", async () => {
		const screen = await render(DateHarness, {
			kind: "monthpicker",
			date: new CalendarDate(2026, 3, 1),
		});
		const group = screen.getByRole("group", { name: "Month" });
		await expect.element(group).toBeVisible();
		await expect.element(group).toHaveTextContent("Março de 2026");
		await expect
			.element(screen.getByRole("button", { name: OPEN }))
			.toHaveAttribute("aria-expanded", "false");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("empty field shows a placeholder; open grid has 12 pt-BR months; passes axe open", async () => {
		const screen = await render(DateHarness, { kind: "monthpicker" });
		await screen.getByRole("button", { name: OPEN }).click();
		const dialog = page.getByRole("dialog");
		await expect.element(dialog).toBeVisible();
		const cells = dialog.getByRole("gridcell").elements();
		expect(cells).toHaveLength(12);
		expect(cells[0].textContent?.trim()).toBe("Jan. 2026");
		expect(cells[11].textContent?.trim()).toBe("Dez. 2026");
		await expect.element(dialog.getByRole("button", { name: "Próximo ano" })).toBeVisible();
		await settled();
		expect(
			await checkA11y(document.querySelector('[role="dialog"]') as HTMLElement)
		).toHaveNoViolations();
		void screen;
	});

	it("picking a month stores the 1st of it, fills the field and closes", async () => {
		const screen = await render(DateHarness, {
			kind: "monthpicker",
			date: new CalendarDate(2026, 3, 15),
		});
		await screen.getByRole("button", { name: OPEN }).click();
		await page.getByRole("button", { name: /^Jun\. 2026/ }).click();
		await expect.element(screen.getByTestId("date")).toHaveTextContent("2026-06-01");
		await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
		await expect
			.element(screen.getByRole("group", { name: "Month" }))
			.toHaveTextContent("Junho de 2026");
	});

	it("year navigation changes the year of the grid and of the picked month", async () => {
		const screen = await render(DateHarness, {
			kind: "monthpicker",
			date: new CalendarDate(2026, 3, 1),
		});
		await screen.getByRole("button", { name: OPEN }).click();
		await page.getByRole("button", { name: "Próximo ano" }).click();
		await expect
			.element(page.getByRole("dialog").getByRole("grid"))
			.toHaveAttribute("aria-label", "2027");
		await page.getByRole("button", { name: "Ano anterior" }).click();
		await page.getByRole("button", { name: "Ano anterior" }).click();
		await page.getByRole("button", { name: /^Dez\. 2025/ }).click();
		await expect.element(screen.getByTestId("date")).toHaveTextContent("2025-12-01");
	});

	it("keyboard: arrows, Home/End, PageUp/PageDown by year, Enter picks, Escape closes", async () => {
		const screen = await render(DateHarness, {
			kind: "monthpicker",
			date: new CalendarDate(2026, 3, 1),
		});
		const trigger = screen.getByRole("button", { name: OPEN });
		(trigger.element() as HTMLElement).focus();
		await userEvent.keyboard("{Enter}");
		await expect.element(page.getByRole("dialog")).toBeVisible();
		await expect.poll(() => document.activeElement?.textContent ?? "").toMatch(/^Mar\. 2026/);
		await userEvent.keyboard("{ArrowRight}");
		await expect.poll(() => document.activeElement?.textContent ?? "").toMatch(/^Abr\. 2026/);
		await userEvent.keyboard("{ArrowDown}");
		await expect.poll(() => document.activeElement?.textContent ?? "").toMatch(/^Jul\. 2026/);
		await userEvent.keyboard("{ArrowLeft}{ArrowUp}");
		await expect.poll(() => document.activeElement?.textContent ?? "").toMatch(/^Mar\. 2026/);
		await userEvent.keyboard("{End}");
		await expect.poll(() => document.activeElement?.textContent ?? "").toMatch(/^Dez\. 2026/);
		await userEvent.keyboard("{Home}");
		await expect.poll(() => document.activeElement?.textContent ?? "").toMatch(/^Jan\. 2026/);
		await userEvent.keyboard("{PageDown}");
		await expect.poll(() => document.activeElement?.textContent ?? "").toMatch(/^Jan\. 2027/);
		await userEvent.keyboard("{PageUp}{PageUp}{ArrowRight}{Enter}");
		await expect.element(screen.getByTestId("date")).toHaveTextContent("2025-02-01");
		await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();

		await userEvent.keyboard("{Enter}");
		await expect.element(page.getByRole("dialog")).toBeVisible();
		await userEvent.keyboard("{Escape}");
		await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
		await expect.element(trigger).toHaveFocus();
	});

	it("minValue and maxValue disable the months outside the range", async () => {
		const screen = await render(DateHarness, {
			kind: "monthpicker",
			date: new CalendarDate(2026, 6, 1),
			minValue: new CalendarDate(2026, 4, 20),
			maxValue: new CalendarDate(2026, 9, 5),
		});
		await screen.getByRole("button", { name: OPEN }).click();
		const march = page.getByRole("button", { name: /^Mar\. 2026/ });
		await expect.element(march).toHaveAttribute("aria-disabled", "true");
		await march.click({ force: true });
		await expect.element(screen.getByTestId("date")).toHaveTextContent("2026-06-01");
		// a month that only partly overlaps the range stays pickable
		await expect
			.element(page.getByRole("button", { name: /^Abr\. 2026/ }))
			.not.toHaveAttribute("aria-disabled", "true");
		await expect
			.element(page.getByRole("button", { name: /^Set\. 2026/ }))
			.not.toHaveAttribute("aria-disabled", "true");
		await expect
			.element(page.getByRole("button", { name: /^Out\. 2026/ }))
			.toHaveAttribute("aria-disabled", "true");
	});

	it("name puts the ISO date of the 1st in the form", async () => {
		const screen = await render(DateHarness, {
			kind: "monthpicker",
			name: "period",
			date: new CalendarDate(2026, 3, 1),
		});
		const input = screen.container.querySelector<HTMLInputElement>('input[name="period"]');
		expect(input?.value).toBe("2026-03-01");
		await screen.getByRole("button", { name: OPEN }).click();
		await page.getByRole("button", { name: /^Ago\. 2026/ }).click();
		expect(input?.value).toBe("2026-08-01");
	});

	it("locale en-US names the months in English", async () => {
		const screen = await render(DateHarness, {
			kind: "monthpicker",
			date: new CalendarDate(2026, 3, 1),
			locale: "en-US",
		});
		await expect
			.element(screen.getByRole("group", { name: "Month" }))
			.toHaveTextContent("March 2026");
		await screen.getByRole("button", { name: OPEN }).click();
		await expect.element(page.getByRole("button", { name: /^Dec 2026/ })).toBeVisible();
	});

	it("error is a role=alert referenced by the group; disabled blocks the trigger", async () => {
		const err = await render(DateHarness, { kind: "monthpicker", error: "Required" });
		const alert = err.getByRole("alert");
		await expect.element(alert).toMatchTextContent("Required");
		expect(
			err.getByRole("group", { name: "Month" }).element().getAttribute("aria-describedby")
		).toBe(alert.element().id);
		expect(await checkA11y(err.container)).toHaveNoViolations();
		err.unmount();

		const dis = await render(DateHarness, { kind: "monthpicker", disabled: true });
		await expect.element(dis.getByRole("button", { name: OPEN })).toBeDisabled();
	});

	it("every month cell is at least the touch target under a coarse pointer", async () => {
		await cdp().send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
		try {
			const screen = await render(DateHarness, { kind: "monthpicker" });
			expect(matchMedia("(pointer: coarse)").matches).toBe(true);
			await screen.getByRole("button", { name: OPEN }).click();
			await expect.element(page.getByRole("dialog")).toBeVisible();
			await settled();
			const cells = page.getByRole("dialog").getByRole("gridcell").elements();
			expect(cells).toHaveLength(12);
			for (const td of cells) {
				const r = (td.querySelector("[data-ca-month]") as HTMLElement).getBoundingClientRect();
				expect(r.width, td.textContent ?? "").toBeGreaterThanOrEqual(touchTarget());
				expect(r.height, td.textContent ?? "").toBeGreaterThanOrEqual(touchTarget());
			}
		} finally {
			await cdp().send("Emulation.setTouchEmulationEnabled", { enabled: false });
		}
	});
});
