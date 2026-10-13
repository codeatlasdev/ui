import { Time } from "@internationalized/date";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import DateHarness from "./DateHarness.test.svelte";

describe("TimeField", () => {
	it("labels the group and shows hour/minute placeholders; passes axe", async () => {
		const screen = await render(DateHarness, { kind: "time" });
		await expect.element(screen.getByRole("group", { name: "Time" })).toBeVisible();
		expect(
			screen
				.getByRole("spinbutton")
				.elements()
				.map((s) => s.textContent)
		).toEqual(["––", "––"]);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("typing 1430 sets 14:30 (24h in pt-BR)", async () => {
		const screen = await render(DateHarness, { kind: "time" });
		(screen.getByRole("spinbutton").first().element() as HTMLElement).focus();
		await userEvent.keyboard("1430");
		await expect.element(screen.getByTestId("time")).toHaveTextContent("14:30:00");
		expect(
			screen
				.getByRole("spinbutton")
				.elements()
				.map((s) => s.textContent)
		).toEqual(["14", "30"]);
	});

	it("arrow keys step the hour and minute segments", async () => {
		const screen = await render(DateHarness, { kind: "time", time: new Time(9, 5) });
		(screen.getByRole("spinbutton").first().element() as HTMLElement).focus();
		await userEvent.keyboard("{ArrowUp}");
		await expect.element(screen.getByTestId("time")).toHaveTextContent("10:05:00");
		await userEvent.keyboard("{ArrowRight}{ArrowUp}");
		await expect.element(screen.getByTestId("time")).toHaveTextContent("10:06:00");
	});

	it("hourCycle 12 with an English locale shows the AM/PM segment", async () => {
		const screen = await render(DateHarness, {
			kind: "time",
			time: new Time(15, 0),
			hourCycle: 12,
			locale: "en-US",
		});
		expect(screen.getByRole("spinbutton").first().element().textContent).toBe("03");
		expect(screen.container.querySelector("[data-segment=dayPeriod]")?.textContent).toBe("PM");
	});

	it("granularity 'second' adds a seconds segment", async () => {
		const screen = await render(DateHarness, { kind: "time", granularity: "second" });
		expect(screen.getByRole("spinbutton").elements()).toHaveLength(3);
	});

	it("error is announced and referenced by the group", async () => {
		const screen = await render(DateHarness, { kind: "time", error: "Time unavailable" });
		const alert = screen.getByRole("alert");
		await expect.element(alert).toMatchTextContent("Time unavailable");
		expect(
			screen.getByRole("group", { name: "Time" }).element().getAttribute("aria-describedby")
		).toBe(alert.element().id);
	});
});
