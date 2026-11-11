import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import Harness from "./Popover.test.svelte";
import OpenHarness from "./PopoverOpen.test.svelte";
import TokenHarness from "./PopoverTokens.test.svelte";

const setup = async () => {
	const screen = await render(Harness);
	const trigger = screen.getByRole("button", { name: "Details" });
	return { screen, trigger };
};

describe("Popover", () => {
	it("is closed initially and trigger reports aria-expanded=false", async () => {
		const { trigger } = await setup();
		await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
		await expect.element(page.getByText("Popover content")).not.toBeInTheDocument();
	});

	it("opens from the keyboard (Enter) and has no axe violations", async () => {
		const { trigger } = await setup();
		(trigger.element() as HTMLElement).focus();
		await userEvent.keyboard("{Enter}");
		await expect.element(page.getByText("Popover content")).toBeVisible();
		await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
		await settled();
		expect(
			await checkA11y(document.querySelector(".ca-popover-content") as HTMLElement)
		).toHaveNoViolations();
	});

	it("opens with Space as well", async () => {
		const { trigger } = await setup();
		(trigger.element() as HTMLElement).focus();
		await userEvent.keyboard(" ");
		await expect.element(page.getByText("Popover content")).toBeVisible();
	});

	it("Tab moves into the popover content", async () => {
		const { trigger } = await setup();
		await trigger.click();
		await expect.element(page.getByText("Popover content")).toBeVisible();
		await userEvent.tab();
		await expect.element(page.getByRole("button", { name: "Inner action" })).toHaveFocus();
	});

	it("Escape closes and returns focus to the trigger", async () => {
		const { trigger } = await setup();
		await trigger.click();
		await expect.element(page.getByText("Popover content")).toBeVisible();
		await userEvent.keyboard("{Escape}");
		await expect.element(page.getByText("Popover content")).not.toBeInTheDocument();
		await expect.element(trigger).toHaveFocus();
		await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
	});
});

describe("Popover bind:open", () => {
	const isOpen = () => page.getByTestId("open");
	const content = () => page.getByText("Popover content");

	it("opening and closing flips the bound value and calls onOpenChange", async () => {
		const onOpenChange = vi.fn();
		const screen = await render(OpenHarness, { onOpenChange });
		await expect.element(isOpen()).toHaveTextContent("false");
		await screen.getByRole("button", { name: "Details" }).click();
		await expect.element(isOpen()).toHaveTextContent("true");
		expect(onOpenChange).toHaveBeenLastCalledWith(true);
		await userEvent.keyboard("{Escape}");
		await expect.element(isOpen()).toHaveTextContent("false");
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
		expect(onOpenChange).toHaveBeenCalledTimes(2);
	});

	it("setting the bound value from outside opens the popover", async () => {
		const onOpenChange = vi.fn();
		const screen = await render(OpenHarness, { onOpenChange });
		await screen.getByRole("button", { name: "Open from outside" }).click();
		await expect.element(content()).toBeVisible();
		await expect
			.element(screen.getByRole("button", { name: "Details" }))
			.toHaveAttribute("aria-expanded", "true");
		expect(onOpenChange).not.toHaveBeenCalled();
	});

	it("close() from the content closes it and returns focus to the trigger", async () => {
		const onOpenChange = vi.fn();
		const screen = await render(OpenHarness, { onOpenChange });
		const trigger = screen.getByRole("button", { name: "Details" });
		await trigger.click();
		await expect.element(content()).toBeVisible();
		await page.getByRole("button", { name: "Pick" }).click();
		await expect.element(content()).not.toBeInTheDocument();
		await expect.element(isOpen()).toHaveTextContent("false");
		await expect.element(trigger).toHaveFocus();
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
	});
});

describe("Popover window blur (#663)", () => {
	it("stays open when the window loses focus: it can hold a form", async () => {
		const { trigger } = await setup();
		await trigger.click();
		await expect.element(page.getByText("Popover content")).toBeVisible();
		window.dispatchEvent(new Event("blur"));
		await settled();
		await expect.element(page.getByText("Popover content")).toBeVisible();
	});
});

describe("Popover tokens and density (#698)", () => {
	const panel = () => document.querySelector(".ca-popover-content") as HTMLElement;
	// offsetWidth ignores the entrance transform (scale 0.96 → 1).
	const width = () => panel().offsetWidth;
	// 1px border each side on the material; measure the content box instead of assuming it.
	const frame = () => {
		const s = getComputedStyle(panel());
		return parseFloat(s.borderLeftWidth) + parseFloat(s.borderRightWidth);
	};

	it("defaults: 16px padding, lg radius, 320px max, overlay fill", async () => {
		await render(TokenHarness);
		await expect.element(page.getByTestId("inner")).toBeVisible();
		const s = getComputedStyle(panel());
		expect(s.paddingLeft).toBe("16px");
		expect(s.maxWidth).toBe("320px");
		expect(width()).toBe(240 + 32 + frame());
		const probe = document.createElement("div");
		probe.className = "glass-overlay";
		document.body.append(probe);
		expect(s.backgroundColor).toBe(getComputedStyle(probe).backgroundColor);
		probe.remove();
	});

	it("--ca-popover-padding: 8px makes 240px of content 256px wide", async () => {
		document.documentElement.style.setProperty("--ca-popover-padding", "8px");
		try {
			await render(TokenHarness);
			await expect.element(page.getByTestId("inner")).toBeVisible();
			expect(width()).toBe(256 + frame());
		} finally {
			document.documentElement.style.removeProperty("--ca-popover-padding");
		}
	});

	it("radius, max-width and bg tokens apply", async () => {
		const root = document.documentElement.style;
		root.setProperty("--ca-popover-radius", "3px");
		root.setProperty("--ca-popover-max-width", "200px");
		root.setProperty("--ca-popover-bg", "rgb(1, 2, 3)");
		try {
			await render(TokenHarness);
			await expect.element(page.getByTestId("inner")).toBeVisible();
			const s = getComputedStyle(panel());
			expect(s.borderTopLeftRadius).toBe("3px");
			expect(s.maxWidth).toBe("200px");
			expect(s.backgroundColor).toBe("rgb(1, 2, 3)");
		} finally {
			for (const n of ["radius", "max-width", "bg"]) root.removeProperty(`--ca-popover-${n}`);
		}
	});

	it('density="compact" gives 8px padding and is axe-clean', async () => {
		await render(TokenHarness, { density: "compact" });
		await expect.element(page.getByTestId("inner")).toBeVisible();
		expect(panel().classList.contains("ca-popover-content--compact")).toBe(true);
		expect(getComputedStyle(panel()).paddingLeft).toBe("8px");
		expect(width()).toBe(256 + frame());
		await settled();
		expect(await checkA11y(panel())).toHaveNoViolations();
	});

	it("a padding token wins over compact density", async () => {
		document.documentElement.style.setProperty("--ca-popover-padding", "4px");
		try {
			await render(TokenHarness, { density: "compact" });
			await expect.element(page.getByTestId("inner")).toBeVisible();
			expect(getComputedStyle(panel()).paddingLeft).toBe("4px");
		} finally {
			document.documentElement.style.removeProperty("--ca-popover-padding");
		}
	});
});
