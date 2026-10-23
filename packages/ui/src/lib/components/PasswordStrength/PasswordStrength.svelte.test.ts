import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import PasswordStrength from "./PasswordStrength.svelte";
import Harness from "./PasswordStrength.test.svelte";

const filled = (c: HTMLElement) => c.querySelectorAll(".ca-pwstrength__seg[data-on]").length;

describe("PasswordStrength", () => {
	it("empty value shows no filled step and a prompt label", async () => {
		const screen = await render(PasswordStrength, { value: "" });
		expect(filled(screen.container)).toBe(0);
		await expect.element(screen.getByText("Enter a password")).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it.each([
		["abc", 1, "Weak"],
		["Tr0ub4dor9", 2, "Fair"],
		["correct horse battery staple", 3, "Strong"],
	] as const)(
		"%s fills %i step(s) and says %s (text, not only colour)",
		async (value, steps, text) => {
			const screen = await render(PasswordStrength, { value });
			expect(filled(screen.container)).toBe(steps);
			await expect.element(screen.getByText(text)).toBeVisible();
			expect(screen.container.querySelector(".ca-pwstrength")?.getAttribute("data-score")).toBe(
				String(steps)
			);
			expect(await checkA11y(screen.container)).toHaveNoViolations();
		}
	);

	it("announces changes politely through its own live label, never assertively", async () => {
		const screen = await render(PasswordStrength, { value: "abc" });
		const live = screen.container.querySelector("[aria-live]") as HTMLElement;
		expect(live.getAttribute("aria-live")).toBe("polite");
		expect(live.textContent).toContain("Weak");
		expect(screen.container.querySelector('[aria-live="assertive"], [role="alert"]')).toBeNull();
	});

	it("updates the label and bar when the bound value changes", async () => {
		const screen = await render(Harness, {});
		await screen.getByLabelText("Password").fill("abc");
		await expect.element(screen.getByText("Weak")).toBeVisible();
		await screen.getByLabelText("Password").fill("correct horse battery staple");
		await expect.element(screen.getByText("Strong")).toBeVisible();
		expect(filled(screen.container)).toBe(3);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("a custom score function drives the steps", async () => {
		const screen = await render(PasswordStrength, { value: "anything", score: () => 3 });
		expect(filled(screen.container)).toBe(3);
		await expect.element(screen.getByText("Strong")).toBeVisible();
	});

	it("labels prop overrides the catalog text", async () => {
		const screen = await render(PasswordStrength, {
			value: "abc",
			labels: { weak: "Too easy" },
		});
		await expect.element(screen.getByText("Too easy")).toBeVisible();
	});

	it("is linkable to a field with an id and has a screen-reader prefix", async () => {
		const screen = await render(PasswordStrength, { value: "abc", id: "pw-strength" });
		expect(screen.container.querySelector("#pw-strength")).not.toBeNull();
		expect(screen.container.querySelector(".ca-pwstrength__label")?.textContent).toContain(
			"Password strength"
		);
	});
});
