import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../tests/a11y";
import Checkbox from "./Checkbox/Checkbox.svelte";
import Combobox from "./Combobox/Combobox.svelte";
import { DateField, DatePicker, DateRangePicker, TimeField } from "./Date/index.js";
import NumberField from "./NumberField/NumberField.svelte";
import Select from "./Select/Select.svelte";
import Switch from "./Switch/Switch.svelte";

const options = [{ value: "a", label: "Alpha" }];

describe("hideLabel (#676)", () => {
	const cases: [string, unknown, Record<string, unknown>, string][] = [
		["NumberField", NumberField, {}, ".ca-nf__label"],
		["Select", Select, { options }, ".ca-sel__label"],
		["Combobox", Combobox, { options }, ".ca-combobox__label"],
		["Checkbox", Checkbox, {}, ".ca-checkbox__label"],
		["Switch", Switch, {}, ".ca-switch__label"],
		["DateField", DateField, {}, ".ca-date__label"],
		["TimeField", TimeField, {}, ".ca-date__label"],
		["DatePicker", DatePicker, {}, ".ca-date__label"],
		["DateRangePicker", DateRangePicker, {}, ".ca-date__label"],
	];
	for (const [name, C, props, sel] of cases) {
		it(`${name}: name kept, nothing drawn`, async () => {
			// biome-ignore lint/suspicious/noExplicitAny: generic component table
			const screen = await render(C as any, { label: "Quantity", hideLabel: true, ...props });
			const label = screen.container.querySelector(sel) as HTMLElement;
			expect(label, "label element stays in the DOM").not.toBeNull();
			expect(label.classList.contains("ca-sr-only")).toBe(true);
			expect(label.getBoundingClientRect().width).toBeLessThanOrEqual(1);
			expect(label.textContent).toContain("Quantity");
			expect(await checkA11y(screen.container)).toHaveNoViolations();
		});
	}

	it("without hideLabel the label is visible", async () => {
		const screen = await render(NumberField, { label: "Quantity" });
		const label = screen.container.querySelector(".ca-nf__label") as HTMLElement;
		expect(label.getBoundingClientRect().width).toBeGreaterThan(20);
	});
});
