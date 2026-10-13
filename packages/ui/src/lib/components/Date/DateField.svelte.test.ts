import { CalendarDate } from "@internationalized/date";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import DateHarness from "./DateHarness.test.svelte";

describe("DateField", () => {
	it("labels the group and exposes pt-BR dd/mm/aaaa segments; passes axe", async () => {
		const screen = await render(DateHarness, { kind: "field" });
		await expect.element(screen.getByRole("group", { name: "Birth date" })).toBeVisible();
		const segs = screen.getByRole("spinbutton").elements();
		expect(segs.map((s) => s.textContent)).toEqual(["dd", "mm", "aaaa"]);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("typing digits fills the segments and updates the value", async () => {
		const screen = await render(DateHarness, { kind: "field" });
		(screen.getByRole("spinbutton").first().element() as HTMLElement).focus();
		await userEvent.keyboard("15032026");
		await expect.element(screen.getByTestId("date")).toHaveTextContent("2026-03-15");
		expect(
			screen
				.getByRole("spinbutton")
				.elements()
				.map((s) => s.textContent)
		).toEqual(["15", "03", "2026"]);
	});

	it("ArrowUp/ArrowDown step the focused segment", async () => {
		const screen = await render(DateHarness, {
			kind: "field",
			date: new CalendarDate(2026, 3, 15),
		});
		const day = screen.getByRole("spinbutton").first();
		(day.element() as HTMLElement).focus();
		await userEvent.keyboard("{ArrowUp}");
		await expect.element(screen.getByTestId("date")).toHaveTextContent("2026-03-16");
		await userEvent.keyboard("{ArrowDown}{ArrowDown}");
		await expect.element(screen.getByTestId("date")).toHaveTextContent("2026-03-14");
		await expect.element(day).toHaveAttribute("aria-valuenow", "14");
	});

	it("shows description, and error with role=alert described by the group", async () => {
		const withHint = await render(DateHarness, {
			kind: "field",
			description: "Use the dd/mm/aaaa format",
		});
		await expect.element(withHint.getByText("Use the dd/mm/aaaa format")).toBeVisible();
		withHint.unmount();
		const withError = await render(DateHarness, { kind: "field", error: "Invalid date" });
		await expect.element(withError.getByRole("alert")).toMatchTextContent("Invalid date");
		const group = withError.getByRole("group", { name: "Birth date" }).element();
		const errId = withError.getByRole("alert").element().id;
		expect(group.getAttribute("aria-describedby")).toBe(errId);
		expect(await checkA11y(withError.container)).toHaveNoViolations();
	});

	it("readonly/disabled segments are not editable", async () => {
		const screen = await render(DateHarness, {
			kind: "field",
			date: new CalendarDate(2026, 3, 15),
			disabled: true,
		});
		await expect
			.element(screen.getByRole("spinbutton").first())
			.toHaveAttribute("aria-disabled", "true");
	});

	it("required label shows a hidden-from-AT asterisk", async () => {
		const screen = await render(DateHarness, { kind: "field", required: true });
		const star = screen.container.querySelector(".ca-date__req");
		expect(star?.getAttribute("aria-hidden")).toBe("true");
	});
});
