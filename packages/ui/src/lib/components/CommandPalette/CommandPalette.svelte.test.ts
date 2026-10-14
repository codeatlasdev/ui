import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { SLOW_FLOW, settled } from "../../../../tests/settled";
import Harness from "./CommandPalette.test.svelte";

const palette = () => page.getByRole("dialog", { name: "Command palette" });
const input = () => page.getByPlaceholder("Search…");

const open = async (props = {}) => {
	const screen = await render(Harness, props);
	const trigger = screen.getByRole("button", { name: "Open palette" });
	await trigger.click();
	await expect.element(palette()).toBeVisible();
	await expect.element(input()).toHaveFocus();
	return { screen, trigger };
};

describe("CommandPalette", () => {
	it("opens, focuses the search input and lists every item grouped by module", async () => {
		await open();
		await expect.element(page.getByRole("option")).toHaveLength(3);
		await expect.element(page.getByText("General", { exact: true })).toBeVisible();
		await expect.element(page.getByText("Account", { exact: true })).toBeVisible();
		await settled();
		expect(await checkA11y(document.body)).toHaveNoViolations();
	});

	it("Ctrl+K / Cmd+K toggles it", async () => {
		await render(Harness);
		await expect.element(palette()).not.toBeInTheDocument();
		await userEvent.keyboard("{Control>}k{/Control}");
		await expect.element(palette()).toBeVisible();
		await userEvent.keyboard("{Control>}k{/Control}");
		await expect.element(palette()).not.toBeInTheDocument();
	});

	it("filters by item label and by module label, case-insensitively", async () => {
		await open();
		await input().fill("rep");
		await expect.element(page.getByRole("option")).toHaveLength(1);
		await expect.element(page.getByRole("option", { name: /Reports/ })).toBeVisible();

		await input().fill("ACCOUNT");
		await expect.element(page.getByRole("option")).toHaveLength(1);
		await expect.element(page.getByRole("option", { name: /Profile/ })).toBeVisible();
	});

	it("empty state on no match; blank query shows all", async () => {
		await open();
		await input().fill("zzzz");
		await expect.element(page.getByText('No results for "zzzz"')).toBeVisible();
		await expect.element(page.getByRole("option")).not.toBeInTheDocument();

		await input().fill("   ");
		await expect.element(page.getByRole("option")).toHaveLength(3);
	});

	it(
		"minQueryLength gates filtering on the trimmed query",
		async () => {
			await open({ minQueryLength: 3 });
			await input().fill("re");
			await expect.element(page.getByRole("option")).toHaveLength(3);
			await expect.element(page.getByText("General", { exact: true })).toBeVisible();

			await input().fill("  re  ");
			await expect.element(page.getByRole("option")).toHaveLength(3);

			await input().fill(" rep ");
			await expect.element(page.getByRole("option")).toHaveLength(1);
			await expect.element(page.getByRole("option", { name: /Reports/ })).toBeVisible();
		},
		SLOW_FLOW
	);

	it(
		"ArrowDown/ArrowUp move aria-selected and clamp at the ends",
		async () => {
			await open();
			const options = page.getByRole("option");
			await expect.element(options.nth(0)).toHaveAttribute("aria-selected", "true");
			await userEvent.keyboard("{ArrowDown}");
			await expect.element(options.nth(1)).toHaveAttribute("aria-selected", "true");
			await expect.element(options.nth(0)).toHaveAttribute("aria-selected", "false");
			await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
			await expect.element(options.nth(2)).toHaveAttribute("aria-selected", "true");
			await userEvent.keyboard("{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}");
			await expect.element(options.nth(0)).toHaveAttribute("aria-selected", "true");
		},
		SLOW_FLOW
	);

	it("Enter navigates to the selected item and closes", async () => {
		const onNavigate = vi.fn();
		await open({ onNavigate });
		await userEvent.keyboard("{ArrowDown}{Enter}");
		expect(onNavigate).toHaveBeenCalledExactlyOnceWith("/reports");
		await expect.element(palette()).not.toBeInTheDocument();
	});

	it("typing then Enter navigates to the first match", async () => {
		const onNavigate = vi.fn();
		await open({ onNavigate });
		await input().fill("profile");
		await userEvent.keyboard("{Enter}");
		expect(onNavigate).toHaveBeenCalledExactlyOnceWith("/account/profile");
	});

	it("clicking an option navigates", async () => {
		const onNavigate = vi.fn();
		await open({ onNavigate });
		await page.getByRole("option", { name: /Home/ }).click();
		expect(onNavigate).toHaveBeenCalledExactlyOnceWith("/");
	});

	it("Escape closes, returns focus to the trigger and the query resets on reopen", async () => {
		const { trigger } = await open();
		await input().fill("rep");
		await userEvent.keyboard("{Escape}");
		await expect.element(palette()).not.toBeInTheDocument();
		await expect.element(trigger).toHaveFocus();

		await trigger.click();
		await expect.element(input()).toHaveValue("");
		await expect.element(page.getByRole("option")).toHaveLength(3);
	});
});

describe("CommandPalette pointer vs keyboard (#80)", () => {
	// A row that appears or slides under a parked pointer fires mouseenter without any movement
	// (list renders, dialog animates in). It must not steal the keyboard selection; only a real move does.
	it("a row entering under a still pointer does not steal the selection", async () => {
		await open();
		const options = page.getByRole("option");
		const third = options.nth(2).element();
		third.dispatchEvent(new MouseEvent("mouseenter", { bubbles: false }));
		third.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
		await userEvent.keyboard("{ArrowDown}");
		await expect.element(options.nth(1)).toHaveAttribute("aria-selected", "true");
		await expect.element(options.nth(2)).toHaveAttribute("aria-selected", "false");
		third.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
		await expect.element(options.nth(2)).toHaveAttribute("aria-selected", "true");
	});

	it("same while filtering", async () => {
		await open({ minQueryLength: 1 });
		await input().fill("o");
		const options = page.getByRole("option");
		await expect.poll(() => options.elements().length).toBeGreaterThan(1);
		const last = options.nth(options.elements().length - 1).element();
		last.dispatchEvent(new MouseEvent("mouseenter", { bubbles: false }));
		await expect.element(options.first()).toHaveAttribute("aria-selected", "true");
		last.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
		await expect
			.element(options.nth(options.elements().length - 1))
			.toHaveAttribute("aria-selected", "true");
	});

	it("ArrowDown on an empty list keeps the selection at 0, not -1", async () => {
		await open();
		await input().fill("zzzz");
		await userEvent.keyboard("{ArrowDown}");
		await input().fill("rep");
		await expect.element(page.getByRole("option").first()).toHaveAttribute("aria-selected", "true");
	});
});
