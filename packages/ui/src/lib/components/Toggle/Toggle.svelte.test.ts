import { Bold } from "@lucide/svelte";
import { describe, expect, it, vi } from "vitest";
import { cdp, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { touchTarget } from "../../../../tests/touch-target";
import ToggleGroup from "../ToggleGroup/ToggleGroup.svelte";
import ToggleHarness from "./ToggleHarness.test.svelte";

describe("Toggle", () => {
	it("is a button with aria-pressed that follows clicks, the bound value and onchange", async () => {
		const onchange = vi.fn();
		const screen = await render(ToggleHarness, { label: "Bold", onchange });
		const bold = screen.getByRole("button", { name: "Bold" });
		await expect.element(bold).toHaveAttribute("aria-pressed", "false");
		await expect.element(bold).toHaveAttribute("data-state", "off");
		await bold.click();
		await expect.element(bold).toHaveAttribute("aria-pressed", "true");
		await expect.element(bold).toHaveAttribute("data-state", "on");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("on");
		expect(onchange).toHaveBeenLastCalledWith(true);
		await bold.click();
		await expect.element(bold).toHaveAttribute("aria-pressed", "false");
		expect(onchange).toHaveBeenLastCalledWith(false);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("starts pressed when pressed is true and is axe-clean in every state", async () => {
		const screen = await render(ToggleHarness, { label: "Bold", initial: true });
		await expect
			.element(screen.getByRole("button", { name: "Bold" }))
			.toHaveAttribute("aria-pressed", "true");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("Space and Enter toggle it from the keyboard", async () => {
		const onchange = vi.fn();
		const screen = await render(ToggleHarness, { label: "Bold", onchange });
		const bold = screen.getByRole("button", { name: "Bold" });
		bold.element().focus();
		await userEvent.keyboard(" ");
		await expect.element(bold).toHaveAttribute("aria-pressed", "true");
		await userEvent.keyboard("{Enter}");
		await expect.element(bold).toHaveAttribute("aria-pressed", "false");
		expect(onchange).toHaveBeenCalledTimes(2);
	});

	it("disabled does not toggle and stays out of the tab order", async () => {
		const onchange = vi.fn();
		const screen = await render(ToggleHarness, { label: "Bold", disabled: true, onchange });
		const bold = screen.getByRole("button", { name: "Bold" });
		await expect.element(bold).toBeDisabled();
		await bold.click({ force: true });
		await expect.element(bold).toHaveAttribute("aria-pressed", "false");
		expect(onchange).not.toHaveBeenCalled();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("icon-only with aria-label is named and axe-clean", async () => {
		const screen = await render(ToggleHarness, { icon: Bold, "aria-label": "Bold" });
		await expect.element(screen.getByRole("button", { name: "Bold" })).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("icon-only without a name warns in dev; a label or aria-label keeps it quiet", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		try {
			await render(ToggleHarness, { icon: Bold, label: "Bold" });
			await render(ToggleHarness, { icon: Bold, "aria-label": "Bold" });
			expect(warn).not.toHaveBeenCalled();
			await render(ToggleHarness, { icon: Bold });
			expect(warn).toHaveBeenCalledWith(
				expect.stringMatching(/^\[ca-ui\] <Toggle> has no accessible name/)
			);
		} finally {
			warn.mockRestore();
		}
	});

	it("looks like a ToggleGroup item: same box, colour and background, pressed and not", async () => {
		const screen = await render(ToggleHarness, { label: "Bold", initial: true });
		const group = await render(ToggleGroup, {
			items: [{ value: "bold", label: "Bold" }],
			type: "multiple",
			value: ["bold"],
			"aria-label": "One",
		});
		const toggle = screen.container.querySelector("button") as HTMLElement;
		const item = group.container.querySelector("button") as HTMLElement;
		const props = [
			"height",
			"paddingLeft",
			"paddingRight",
			"borderTopLeftRadius",
			"fontSize",
			"fontWeight",
			"color",
			"backgroundColor",
		] as const;
		for (const p of props) expect(getComputedStyle(toggle)[p], p).toBe(getComputedStyle(item)[p]);
		const frame = screen.container.querySelector(".ca-toggle-group") as HTMLElement;
		const groupFrame = group.container.querySelector(".ca-toggle-group") as HTMLElement;
		for (const p of [
			"borderTopWidth",
			"paddingTop",
			"borderTopLeftRadius",
			"backgroundColor",
		] as const)
			expect(getComputedStyle(frame)[p], p).toBe(getComputedStyle(groupFrame)[p]);
	});

	it("ghost has no frame; sm is shorter than md", async () => {
		const ghost = await render(ToggleHarness, { label: "Bold", variant: "ghost" });
		const frame = getComputedStyle(
			ghost.container.querySelector(".ca-toggle-group") as HTMLElement
		);
		expect(frame.borderTopWidth).toBe("0px");
		expect(frame.paddingTop).toBe("0px");
		const md = await render(ToggleHarness, { label: "Bold", variant: "ghost" });
		const sm = await render(ToggleHarness, { label: "Bold", variant: "ghost", size: "sm" });
		const h = (c: HTMLElement) =>
			(c.querySelector("button") as HTMLElement).getBoundingClientRect().height;
		expect(h(sm.container)).toBeLessThan(h(md.container));
	});

	it("under a coarse pointer the button is at least the touch target in both axes", async () => {
		await cdp().send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
		try {
			const screen = await render(ToggleHarness, { icon: Bold, "aria-label": "Bold", size: "sm" });
			expect(matchMedia("(pointer: coarse)").matches).toBe(true);
			const r = (screen.container.querySelector("button") as HTMLElement).getBoundingClientRect();
			expect(r.width, "width").toBeGreaterThanOrEqual(touchTarget());
			expect(r.height, "height").toBeGreaterThanOrEqual(touchTarget());
		} finally {
			await cdp().send("Emulation.setTouchEmulationEnabled", { enabled: false });
		}
	});

	it("passes extra attributes and a class to the button", async () => {
		const screen = await render(ToggleHarness, {
			label: "Bold",
			class: "mine",
			"data-testid": "t",
			title: "Bold text",
		});
		const t = screen.getByTestId("t").element();
		expect(t.tagName).toBe("BUTTON");
		expect(t.classList.contains("mine")).toBe(true);
		expect(t.getAttribute("title")).toBe("Bold text");
	});
});
