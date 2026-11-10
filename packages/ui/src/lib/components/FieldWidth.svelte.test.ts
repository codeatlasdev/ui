import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../tests/a11y";
import ColorField from "./ColorField/ColorField.svelte";
import Combobox from "./Combobox/Combobox.svelte";
import FieldWidthRow from "./FieldWidthRow.test.svelte";
import NumberField from "./NumberField/NumberField.svelte";
import Select from "./Select/Select.svelte";
import TextField from "./TextField/TextField.svelte";

const options = [{ value: "a", label: "Alpha" }];
const rem = () => Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
const width = (el: Element | null) => (el as HTMLElement).getBoundingClientRect().width;

describe("field width (#740 #693)", () => {
	const roots: [string, unknown, Record<string, unknown>, string][] = [
		["TextField", TextField, {}, ".ca-tf"],
		["Select", Select, { options }, ".ca-sel"],
		["Combobox", Combobox, { options }, ".ca-combobox"],
		["NumberField", NumberField, {}, ".ca-nf"],
		["ColorField", ColorField, {}, ".ca-color-field"],
	];
	for (const [name, C, props, sel] of roots) {
		it(`${name}: width="12rem" sets the root width`, async () => {
			// biome-ignore lint/suspicious/noExplicitAny: generic component table
			const screen = await render(C as any, { label: "A", width: "12rem", ...props });
			expect(width(screen.container.querySelector(sel))).toBeCloseTo(12 * rem(), 0);
		});
	}

	it("Select width auto sizes to content inside a flex row; default fills it", async () => {
		const screen = await render(FieldWidthRow);
		const [auto, full] = [".auto .ca-sel", ".full .ca-sel"].map((q) =>
			width(screen.container.querySelector(q))
		);
		expect(auto).toBeLessThan(full / 2);
	});

	it("a Select truncated value exposes the full text through title", async () => {
		const long = "A very long option label that cannot fit";
		const screen = await render(Select, {
			label: "A",
			value: "a",
			width: "60px",
			options: [{ value: "a", label: long }],
		});
		expect(screen.container.querySelector(".ca-sel__value")?.getAttribute("title")).toBe(long);
	});

	it("NumberField steppers={false} drops both buttons, keeps the input and the name", async () => {
		const screen = await render(NumberField, { label: "Qty", steppers: false, min: 0, max: 5 });
		expect(screen.container.querySelectorAll(".ca-nf__btn").length).toBe(0);
		await expect.element(screen.getByRole("spinbutton", { name: "Qty" })).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("NumberField keeps both steppers by default", async () => {
		const screen = await render(NumberField, { label: "Qty" });
		expect(screen.container.querySelectorAll(".ca-nf__btn").length).toBe(2);
	});

	it("NumberField steppers={false} width=6rem is one 96px input at control height", async () => {
		const screen = await render(NumberField, { label: "D", steppers: false, width: "6rem" });
		const wrap = screen.container.querySelector(".ca-nf__wrap");
		expect(width(wrap)).toBeCloseTo(6 * rem(), 0);
	});
});
