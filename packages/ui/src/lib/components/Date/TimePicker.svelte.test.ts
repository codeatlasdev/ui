import { Time } from "@internationalized/date";
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

const OPEN = "Abrir lista de horários";

describe("TimePicker", () => {
	it("closed: labelled group, pt-BR segments and a listbox trigger; passes axe", async () => {
		const screen = await render(DateHarness, { kind: "timepicker" });
		await expect.element(screen.getByRole("group", { name: "Time" })).toBeVisible();
		expect(
			screen
				.getByRole("spinbutton")
				.elements()
				.map((s) => s.textContent)
		).toEqual(["––", "––"]);
		const trigger = screen.getByRole("button", { name: OPEN });
		await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
		await expect.element(trigger).toHaveAttribute("aria-haspopup", "listbox");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("opens a listbox of times in steps of 15 minutes; passes axe open", async () => {
		const screen = await render(DateHarness, { kind: "timepicker" });
		await screen.getByRole("button", { name: OPEN }).click();
		const list = page.getByRole("listbox");
		await expect.element(list).toBeVisible();
		const options = list.getByRole("option").elements();
		expect(options).toHaveLength(96);
		expect(options[0].textContent).toBe("00:00");
		expect(options[1].textContent).toBe("00:15");
		expect(options[95].textContent).toBe("23:45");
		await settled();
		expect(
			await checkA11y(document.querySelector('[role="listbox"]')?.parentElement as HTMLElement)
		).toHaveNoViolations();
		void screen;
	});

	it("picking a time sets the value, fills the segments and closes the popover", async () => {
		const screen = await render(DateHarness, { kind: "timepicker" });
		await screen.getByRole("button", { name: OPEN }).click();
		await page.getByRole("option", { name: "14:30" }).click();
		await expect.element(screen.getByTestId("time")).toHaveTextContent("14:30:00");
		await expect.element(page.getByRole("listbox")).not.toBeInTheDocument();
		expect(
			screen
				.getByRole("spinbutton")
				.elements()
				.map((s) => s.textContent)
		).toEqual(["14", "30"]);
	});

	it("step, hourCycle 12 and en-US labels", async () => {
		const screen = await render(DateHarness, {
			kind: "timepicker",
			step: 60,
			hourCycle: 12,
			locale: "en-US",
		});
		await screen.getByRole("button", { name: OPEN }).click();
		const options = page.getByRole("listbox").getByRole("option").elements();
		expect(options).toHaveLength(24);
		expect(options[0].textContent).toBe("12:00 AM");
		expect(options[13].textContent).toBe("1:00 PM");
	});

	it("the selected value is aria-selected and scrolled into view on open", async () => {
		const screen = await render(DateHarness, { kind: "timepicker", time: new Time(21, 45) });
		await screen.getByRole("button", { name: OPEN }).click();
		const selected = page.getByRole("option", { name: "21:45" });
		await expect.element(selected).toHaveAttribute("aria-selected", "true");
		await expect.element(selected).toBeInViewport();
		const list = document.querySelector('[role="listbox"]') as HTMLElement;
		expect(list.scrollTop).toBeGreaterThan(0);
	});

	it("keyboard: Enter opens, arrows move, Enter picks, Escape closes to the trigger", async () => {
		const screen = await render(DateHarness, { kind: "timepicker", time: new Time(9, 0) });
		const trigger = screen.getByRole("button", { name: OPEN });
		(trigger.element() as HTMLElement).focus();
		await userEvent.keyboard("{Enter}");
		await expect.element(page.getByRole("listbox")).toBeVisible();
		await expect.poll(() => document.activeElement?.textContent ?? "").toBe("09:00");
		await userEvent.keyboard("{ArrowDown}{ArrowDown}{Enter}");
		await expect.element(screen.getByTestId("time")).toHaveTextContent("09:30:00");
		await expect.element(page.getByRole("listbox")).not.toBeInTheDocument();
		await expect.element(trigger).toHaveFocus();

		await userEvent.keyboard("{Enter}");
		await expect.element(page.getByRole("listbox")).toBeVisible();
		await userEvent.keyboard("{ArrowUp}{Home}");
		await expect.poll(() => document.activeElement?.textContent ?? "").toBe("00:00");
		await userEvent.keyboard("{End}");
		await expect.poll(() => document.activeElement?.textContent ?? "").toBe("23:45");
		await userEvent.keyboard("{Escape}");
		await expect.element(page.getByRole("listbox")).not.toBeInTheDocument();
		await expect.element(trigger).toHaveFocus();
		await expect.element(screen.getByTestId("time")).toHaveTextContent("09:30:00");
	});

	it("minValue and maxValue disable the times outside the range", async () => {
		const screen = await render(DateHarness, {
			kind: "timepicker",
			timeMin: new Time(9, 0),
			maxValue: new Time(17, 0),
		});
		await screen.getByRole("button", { name: OPEN }).click();
		const early = page.getByRole("option", { name: "08:45" });
		await expect.element(early).toHaveAttribute("aria-disabled", "true");
		await early.click({ force: true });
		await expect.element(screen.getByTestId("time")).toHaveTextContent("");
		await expect
			.element(page.getByRole("option", { name: "09:00" }))
			.not.toHaveAttribute("aria-disabled");
		await expect
			.element(page.getByRole("option", { name: "17:15" }))
			.toHaveAttribute("aria-disabled", "true");
		// the arrow keys skip disabled times
		await expect.poll(() => document.activeElement?.textContent ?? "").toBe("09:00");
		await userEvent.keyboard("{ArrowUp}");
		await expect.poll(() => document.activeElement?.textContent ?? "").toBe("09:00");
	});

	it("name puts the ISO time in the form", async () => {
		const screen = await render(DateHarness, {
			kind: "timepicker",
			name: "start",
			time: new Time(8, 5),
		});
		const input = screen.container.querySelector<HTMLInputElement>('input[name="start"]');
		expect(input?.value).toBe("08:05:00");
		await screen.getByRole("button", { name: OPEN }).click();
		await page.getByRole("option", { name: "10:15" }).click();
		expect(input?.value).toBe("10:15:00");
	});

	it("error is a role=alert referenced by the group; disabled blocks the trigger", async () => {
		const err = await render(DateHarness, { kind: "timepicker", error: "Required" });
		const alert = err.getByRole("alert");
		await expect.element(alert).toMatchTextContent("Required");
		expect(
			err.getByRole("group", { name: "Time" }).element().getAttribute("aria-describedby")
		).toBe(alert.element().id);
		expect(await checkA11y(err.container)).toHaveNoViolations();
		err.unmount();

		const dis = await render(DateHarness, { kind: "timepicker", disabled: true });
		await expect.element(dis.getByRole("button", { name: OPEN })).toBeDisabled();
	});

	it("typing into the segments updates the value", async () => {
		const screen = await render(DateHarness, { kind: "timepicker" });
		(screen.getByRole("spinbutton").first().element() as HTMLElement).focus();
		await userEvent.keyboard("1430");
		await expect.element(screen.getByTestId("time")).toHaveTextContent("14:30:00");
	});

	it("every time row is at least the touch target under a coarse pointer", async () => {
		await cdp().send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
		try {
			const screen = await render(DateHarness, { kind: "timepicker" });
			expect(matchMedia("(pointer: coarse)").matches).toBe(true);
			await screen.getByRole("button", { name: OPEN }).click();
			await expect.element(page.getByRole("listbox")).toBeVisible();
			await settled();
			const rows = page.getByRole("listbox").getByRole("option").elements();
			expect(rows.length).toBeGreaterThan(0);
			for (const el of rows) {
				expect(el.getBoundingClientRect().height, el.textContent ?? "").toBeGreaterThanOrEqual(
					touchTarget()
				);
			}
		} finally {
			await cdp().send("Emulation.setTouchEmulationEnabled", { enabled: false });
		}
	});
});
