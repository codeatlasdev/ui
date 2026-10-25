import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import ColorFieldHarness from "./ColorFieldHarness.test.svelte";

describe("ColorField", () => {
	it("commits a typed oklch() as typed and passes axe", async () => {
		const screen = await render(ColorFieldHarness, { against: "#ffffff" });
		const input = screen.getByRole("textbox", { name: "Brand" });
		await input.fill("oklch(0.5 0.2 30)");
		await userEvent.keyboard("{Enter}");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("oklch(0.5 0.2 30)");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("rejects an invalid color with an error and never writes it to value", async () => {
		const onchange = vi.fn();
		const screen = await render(ColorFieldHarness, { onchange });
		await screen.getByRole("textbox", { name: "Brand" }).fill("nope");
		await userEvent.keyboard("{Enter}");
		await expect
			.element(screen.getByRole("alert"))
			.toHaveTextContent("Use #rrggbb, rgb() or oklch()");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("#2b5fd9");
		expect(onchange).not.toHaveBeenCalled();
	});

	it("shows the contrast ratio, and says so in words when it fails", async () => {
		const pass = await render(ColorFieldHarness, { initial: "#595959", against: "#ffffff" });
		await expect.element(pass.getByText("7.0:1", { exact: true })).toBeInTheDocument();
		await expect.element(pass.getByText("Passes AAA")).toBeInTheDocument();
		pass.unmount();
		// 4.48:1 prints as "4.5:1" but is under the threshold: the verdict must follow the real ratio.
		const edge = await render(ColorFieldHarness, { initial: "#777777", against: "#ffffff" });
		await expect.element(edge.getByText("Below 4.5:1")).toBeInTheDocument();
		edge.unmount();
		const fail = await render(ColorFieldHarness, { initial: "#cccccc", against: "#ffffff" });
		await expect.element(fail.getByText("Below 4.5:1")).toBeInTheDocument();
	});

	it("the native picker writes hex and the field follows", async () => {
		const screen = await render(ColorFieldHarness);
		const native = screen.container.querySelector<HTMLInputElement>('input[type="color"]');
		if (!native) throw new Error("native color input missing");
		native.value = "#ff0000";
		native.dispatchEvent(new Event("input", { bubbles: true }));
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("#ff0000");
		await expect.element(screen.getByRole("textbox", { name: "Brand" })).toHaveValue("#ff0000");
	});
});
