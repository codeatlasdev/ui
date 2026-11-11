import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import PasswordStrength from "./PasswordStrength.svelte";
import Harness from "./PasswordStrength.test.svelte";
import HideHarness from "./PasswordStrengthHide.test.svelte";

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

	it("layout inline puts the bar and label in one row (#703)", async () => {
		const stacked = await render(PasswordStrength, { value: "abc" });
		const root = stacked.container.querySelector(".ca-pwstrength") as HTMLElement;
		expect(root.getAttribute("data-layout")).toBe("stacked");
		expect(getComputedStyle(root).display).toBe("grid");
		const inline = await render(PasswordStrength, { value: "abc", layout: "inline" });
		const row = inline.container.querySelector(".ca-pwstrength") as HTMLElement;
		expect(row.getAttribute("data-layout")).toBe("inline");
		expect(getComputedStyle(row).display).toBe("flex");
		const bar = row.querySelector(".ca-pwstrength__bar") as HTMLElement;
		const label = row.querySelector(".ca-pwstrength__label") as HTMLElement;
		expect(label.getBoundingClientRect().left).toBeGreaterThanOrEqual(
			bar.getBoundingClientRect().right
		);
		expect(bar.getBoundingClientRect().width).toBeGreaterThan(label.getBoundingClientRect().width);
		expect(await checkA11y(inline.container)).toHaveNoViolations();
	});

	it("tokens set the gap, empty segment colour and label typography (#703)", async () => {
		const screen = await render(PasswordStrength, { value: "", layout: "inline" });
		const row = screen.container.querySelector(".ca-pwstrength") as HTMLElement;
		const seg = row.querySelector(".ca-pwstrength__seg") as HTMLElement;
		const label = row.querySelector(".ca-pwstrength__label") as HTMLElement;
		row.style.setProperty("--ca-pwstrength-gap", "12px");
		row.style.setProperty("--ca-pwstrength-empty-bg", "rgb(1, 2, 3)");
		row.style.setProperty("--ca-pwstrength-label-leading", "20px");
		row.style.setProperty("--ca-pwstrength-label-tracking", "2px");
		expect(getComputedStyle(row).columnGap).toBe("12px");
		seg.style.transition = "none";
		expect(getComputedStyle(seg).backgroundColor).toBe("rgb(1, 2, 3)");
		expect(getComputedStyle(label).lineHeight).toBe("20px");
		expect(getComputedStyle(label).letterSpacing).toBe("2px");
	});

	it("hideWhenEmpty hides the meter but keeps the live region mounted (#703)", async () => {
		const screen = await render(PasswordStrength, { value: "", hideWhenEmpty: true });
		const root = screen.container.querySelector(".ca-pwstrength") as HTMLElement;
		const live = screen.container.querySelector("[aria-live]") as HTMLElement;
		expect(root).not.toBeNull();
		expect(live).not.toBeNull();
		expect(root.hasAttribute("data-empty")).toBe(true);
		expect(root.getBoundingClientRect().height).toBeLessThanOrEqual(1);
		expect(live.textContent?.trim()).toBe("");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("hideWhenEmpty: the first strength after typing is announced in the same live node (#703)", async () => {
		const screen = await render(HideHarness, {});
		const live = screen.container.querySelector("[aria-live]") as HTMLElement;
		await screen.getByLabelText("Password").fill("abc");
		await expect.element(screen.getByText("Weak")).toBeVisible();
		expect(screen.container.querySelector("[aria-live]")).toBe(live);
		expect(live.textContent).toContain("Weak");
		const root = screen.container.querySelector(".ca-pwstrength") as HTMLElement;
		expect(root.hasAttribute("data-empty")).toBe(false);
		expect(root.getBoundingClientRect().height).toBeGreaterThan(0);
		await screen.getByLabelText("Password").fill("");
		expect(root.hasAttribute("data-empty")).toBe(true);
	});

	it("without hideWhenEmpty an empty meter still shows its prompt (#703)", async () => {
		const screen = await render(PasswordStrength, { value: "" });
		const root = screen.container.querySelector(".ca-pwstrength") as HTMLElement;
		expect(root.hasAttribute("data-empty")).toBe(false);
		expect(root.getBoundingClientRect().height).toBeGreaterThan(0);
	});
});
