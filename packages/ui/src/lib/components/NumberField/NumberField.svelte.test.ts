import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import NumberField from "./NumberField.svelte";
import Suffix from "./NumberFieldSuffix.test.svelte";

describe("NumberField", () => {
	it("associates the label with the spinbutton", async () => {
		const screen = await render(NumberField, { label: "Quantity", value: 3 });
		const input = screen.getByRole("spinbutton", { name: "Quantity" });
		await expect.element(input).toHaveValue(3);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("increase/decrease buttons respect step", async () => {
		const onchange = vi.fn();
		const screen = await render(NumberField, { label: "Qty", value: 10, step: 5, onchange });
		await screen.getByRole("button", { name: "Increase" }).click();
		await expect.element(screen.getByRole("spinbutton")).toHaveValue(15);
		await screen.getByRole("button", { name: "Decrease" }).click();
		await screen.getByRole("button", { name: "Decrease" }).click();
		await expect.element(screen.getByRole("spinbutton")).toHaveValue(5);
		expect(onchange).toHaveBeenLastCalledWith(5);
	});

	it("buttons are activated from the keyboard and clamp to min/max", async () => {
		const screen = await render(NumberField, { label: "Qty", value: 1, min: 0, max: 2 });
		const inc = screen.getByRole("button", { name: "Increase" });
		const dec = screen.getByRole("button", { name: "Decrease" });
		inc.element().focus();
		await userEvent.keyboard("{Enter}");
		await expect.element(screen.getByRole("spinbutton")).toHaveValue(2);
		await expect.element(inc).toBeDisabled();
		dec.element().focus();
		await userEvent.keyboard("{Enter}");
		await userEvent.keyboard("{Enter}");
		await expect.element(screen.getByRole("spinbutton")).toHaveValue(0);
		await expect.element(dec).toBeDisabled();
	});

	it("exposes min/max/step on the input and steps with ArrowUp/ArrowDown", async () => {
		const screen = await render(NumberField, {
			label: "Step",
			value: 0,
			min: 0,
			max: 10,
			step: 2,
		});
		const input = screen.getByRole("spinbutton", { name: "Step" });
		await expect.element(input).toHaveAttribute("min", "0");
		await expect.element(input).toHaveAttribute("max", "10");
		await expect.element(input).toHaveAttribute("step", "2");
		input.element().focus();
		await userEvent.keyboard("{ArrowUp}{ArrowUp}");
		await expect.element(input).toHaveValue(4);
		await userEvent.keyboard("{ArrowDown}");
		await expect.element(input).toHaveValue(2);
	});

	it("typing a number updates value and calls onchange", async () => {
		const onchange = vi.fn();
		const screen = await render(NumberField, { label: "Qty", value: 0, onchange });
		await screen.getByRole("spinbutton").fill("42");
		expect(onchange).toHaveBeenLastCalledWith(42);
	});

	it("error sets aria-invalid, role=alert and describes the input", async () => {
		const screen = await render(NumberField, {
			label: "Qty",
			description: "Hint",
			error: "Out of range",
		});
		const input = screen.getByRole("spinbutton", { name: "Qty" });
		await expect.element(input).toHaveAttribute("aria-invalid", "true");
		await expect.element(screen.getByRole("alert")).toHaveTextContent("Out of range");
		await expect.element(input).toHaveAccessibleDescription("Out of range");
		expect(input.element().getAttribute("aria-describedby")).toBe(
			screen.getByRole("alert").element().id
		);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("description is the accessible description", async () => {
		const screen = await render(NumberField, { label: "Qty", description: "In units" });
		await expect.element(screen.getByRole("spinbutton")).toHaveAccessibleDescription("In units");
	});
});

describe("NumberField suffix (#811)", () => {
	it("groups the number and its unit control under the field label", async () => {
		const screen = await render(Suffix, {});
		const group = screen.getByRole("group", { name: "Wait" });
		await expect.element(group).toBeVisible();
		const root = group.element();
		expect(root.contains(screen.getByRole("spinbutton").element())).toBe(true);
		expect(root.contains(screen.getByRole("button", { name: /Unit/ }).element())).toBe(true);
		await expect.element(screen.getByRole("spinbutton", { name: "Wait" })).toHaveValue(5);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("without a suffix the field is not a group", async () => {
		const screen = await render(NumberField, { label: "Qty" });
		expect(screen.container.querySelector('[role="group"]')).toBeNull();
	});

	it("the suffix shares the control row with the input and matches its height", async () => {
		const screen = await render(Suffix, {});
		const wrap = screen.container.querySelector(".ca-nf__wrap") as HTMLElement;
		const suffix = screen.container.querySelector(".ca-nf__suffix") as HTMLElement;
		const a = wrap.getBoundingClientRect();
		const b = suffix.getBoundingClientRect();
		expect(Math.abs(a.top - b.top)).toBeLessThan(1);
		expect(b.left).toBeGreaterThanOrEqual(a.right);
		expect(Math.round(b.height)).toBe(Math.round(a.height));
	});
});
