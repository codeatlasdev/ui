import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import TextArea from "./TextArea.svelte";

describe("TextArea", () => {
	it("associates the label with the textarea", async () => {
		const screen = await render(TextArea, { label: "Message" });
		const field = screen.getByLabelText("Message");
		await field.fill("Hello\nworld");
		await expect.element(field).toHaveValue("Hello\nworld");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("description is the accessible description", async () => {
		const screen = await render(TextArea, { label: "Bio", description: "Up to 200 characters" });
		await expect
			.element(screen.getByLabelText("Bio"))
			.toHaveAccessibleDescription("Up to 200 characters");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("error sets aria-invalid, role=alert and describes the field", async () => {
		const screen = await render(TextArea, {
			label: "Bio",
			description: "Hint",
			error: "Required",
		});
		const field = screen.getByLabelText("Bio");
		await expect.element(field).toHaveAttribute("aria-invalid", "true");
		await expect.element(screen.getByRole("alert")).toHaveTextContent("Required");
		await expect.element(field).toHaveAccessibleDescription("Required");
		expect(field.element().getAttribute("aria-describedby")).toBe(
			screen.getByRole("alert").element().id
		);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("reports typed value through oninput", async () => {
		const oninput = vi.fn();
		const screen = await render(TextArea, { label: "Note", oninput });
		await screen.getByLabelText("Note").fill("abc");
		expect(oninput).toHaveBeenLastCalledWith("abc");
	});

	it("readonly and disabled states are exposed", async () => {
		const ro = await render(TextArea, { label: "Read only", readonly: true, value: "x" });
		await expect.element(ro.getByLabelText("Read only")).toHaveAttribute("readonly");
		const dis = await render(TextArea, { label: "Off", disabled: true });
		await expect.element(dis.getByLabelText("Off")).toBeDisabled();
	});
});
