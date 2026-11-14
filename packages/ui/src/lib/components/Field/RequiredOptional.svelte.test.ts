import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import Harness from "./RequiredOptional.test.svelte";

// #1215: "optional" must be text a screen reader reads with the name, not a missing asterisk; "required" must
// reach assistive tech on every field (native `required`, or the "(required)" text on a button trigger).
describe("required and optional fields (#1215)", () => {
	it("optional: in each name", async () => {
		const screen = await render(Harness, { mode: "optional" });
		await expect
			.element(screen.getByRole("textbox", { name: "Nickname (optional)" }))
			.toBeVisible();
		await expect.element(screen.getByRole("textbox", { name: "Bio (optional)" })).toBeVisible();
		await expect.element(screen.getByRole("spinbutton", { name: "Age (optional)" })).toBeVisible();
		await expect.element(screen.getByRole("button", { name: /^Plan \(optional\)/ })).toBeVisible();
		await expect.element(screen.getByRole("button", { name: /^Team \(optional\)/ })).toBeVisible();
		await expect.element(screen.getByRole("textbox", { name: "Notes (optional)" })).toBeVisible();
		expect(screen.container.textContent).not.toContain("*");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("required: reaches AT", async () => {
		const screen = await render(Harness, { mode: "required" });
		await expect.element(screen.getByRole("textbox", { name: "Nickname" })).toBeRequired();
		await expect.element(screen.getByRole("textbox", { name: "Bio" })).toBeRequired();
		await expect.element(screen.getByRole("spinbutton", { name: "Age" })).toBeRequired();
		await expect.element(screen.getByRole("button", { name: /^Plan \(required\)/ })).toBeVisible();
		await expect.element(screen.getByRole("button", { name: /^Team \(required\)/ })).toBeVisible();
		const stars = [...screen.container.querySelectorAll("label span")].filter(
			(s) => s.textContent?.trim() === "*"
		);
		expect(stars.length).toBeGreaterThanOrEqual(6);
		for (const s of stars) expect(s.getAttribute("aria-hidden")).toBe("true");
		expect(screen.container.textContent).not.toContain("optional");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});
