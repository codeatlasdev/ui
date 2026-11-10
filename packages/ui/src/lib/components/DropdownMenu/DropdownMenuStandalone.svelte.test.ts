import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { settled } from "../../../../tests/settled";
import CheckboxOnly from "./DropdownMenuCheckboxOnly.test.svelte";
import RadioOnly from "./DropdownMenuRadioOnly.test.svelte";

// This file never imports DropdownMenuItem.svelte, so the item rules can only arrive through the
// item that is rendered (#699: a page with only LocaleSwitcher opened an unstyled menu).
async function expectStyledItem(
	trigger: string,
	role: "menuitemradio" | "menuitemcheckbox",
	name: string
) {
	await page.getByRole("button", { name: trigger }).click();
	const item = page.getByRole(role, { name });
	await expect.element(item).toBeVisible();
	await settled();
	const el = item.element() as HTMLElement;
	const probe = document.createElement("div");
	probe.style.height = "var(--ca-control-height)";
	document.body.append(probe);
	const expected = probe.getBoundingClientRect().height;
	probe.remove();
	expect(expected).toBeGreaterThan(0);
	expect(el.getBoundingClientRect().height).toBe(expected);
	expect(Number.parseFloat(getComputedStyle(el).paddingInlineStart)).toBeGreaterThan(0);
	const indicator = el.querySelector(".ca-dropdown-item__indicator") as HTMLElement;
	expect(indicator.getBoundingClientRect().width).toBe(14);
}

describe("DropdownMenu items rendered without DropdownMenuItem", () => {
	it("a radio item is padded, control-height and has the indicator column", async () => {
		await render(RadioOnly);
		await expectStyledItem("Language", "menuitemradio", "Português");
	});

	it("a checkbox item is padded, control-height and has the indicator column", async () => {
		await render(CheckboxOnly);
		await expectStyledItem("View", "menuitemcheckbox", "Show hidden files");
	});
});
