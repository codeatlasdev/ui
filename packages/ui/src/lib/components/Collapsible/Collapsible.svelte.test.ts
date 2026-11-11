import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { touchTarget } from "../../../../tests/touch-target";
import CollapsibleHarness from "./CollapsibleHarness.test.svelte";

describe("Collapsible", () => {
	it("starts closed with aria-expanded=false", async () => {
		const screen = await render(CollapsibleHarness, {});
		await expect
			.element(screen.getByRole("button", { name: "Details" }))
			.toHaveAttribute("aria-expanded", "false");
		await expect.element(screen.getByText("Collapsible content")).not.toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("click toggles content, aria-expanded and bound open", async () => {
		const screen = await render(CollapsibleHarness, {});
		const trigger = screen.getByRole("button", { name: "Details" });
		await trigger.click();
		await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
		await expect.element(screen.getByText("Collapsible content")).toBeVisible();
		await expect.element(screen.getByTestId("open")).toHaveTextContent("true");
		expect(await checkA11y(screen.container)).toHaveNoViolations();

		await trigger.click();
		await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
		await expect.element(screen.getByTestId("open")).toHaveTextContent("false");
	});

	it("toggles with Enter and Space", async () => {
		const screen = await render(CollapsibleHarness, {});
		const trigger = screen.getByRole("button", { name: "Details" });
		(trigger.element() as HTMLElement).focus();
		await userEvent.keyboard("{Enter}");
		await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
		await userEvent.keyboard(" ");
		await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
	});

	it("disabled trigger does not open", async () => {
		const screen = await render(CollapsibleHarness, { disabled: true });
		const trigger = screen.getByRole("button", { name: "Details" });
		await expect.element(trigger).toBeDisabled();
		await trigger.click({ force: true });
		await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
	});

	it("respects open=true initially", async () => {
		const screen = await render(CollapsibleHarness, { open: true });
		await expect
			.element(screen.getByRole("button", { name: "Details" }))
			.toHaveAttribute("aria-expanded", "true");
		await expect.element(screen.getByText("Collapsible content")).toBeVisible();
	});

	describe("variant", () => {
		const css = (el: Element) => getComputedStyle(el);

		it("boxed (default) keeps the box: border, radius, padding", async () => {
			const screen = await render(CollapsibleHarness, { open: true });
			const root = screen.container.querySelector(".ca-collapsible") as HTMLElement;
			const trigger = root.querySelector(".ca-collapsible__trigger") as HTMLElement;
			expect(root.dataset.variant).toBe("boxed");
			expect(Number.parseFloat(css(trigger).borderTopWidth)).toBeGreaterThan(0);
			expect(Number.parseFloat(css(trigger).borderTopLeftRadius)).toBeGreaterThan(0);
			expect(Number.parseFloat(css(trigger).paddingLeft)).toBeGreaterThan(0);
		});

		it("flush has no border, radius, background or inline padding and aligns to the parent's left", async () => {
			const screen = await render(CollapsibleHarness, { variant: "flush", open: true });
			const root = screen.container.querySelector(".ca-collapsible") as HTMLElement;
			const trigger = root.querySelector(".ca-collapsible__trigger") as HTMLElement;
			const body = root.querySelector(".ca-collapsible__body") as HTMLElement;
			const title = root.querySelector(".ca-collapsible__title") as HTMLElement;
			const chevron = root.querySelector(".ca-collapsible__chevron") as HTMLElement;
			expect(root.dataset.variant).toBe("flush");
			for (const el of [root, trigger, body]) {
				const c = css(el);
				expect(c.borderTopLeftRadius, "radius").toBe("0px");
				expect(c.borderBottomRightRadius, "radius").toBe("0px");
				expect(c.borderLeftWidth, "border").toBe("0px");
				expect(c.borderRightWidth, "border").toBe("0px");
				expect(c.borderBottomWidth, "border").toBe("0px");
				expect(c.backgroundColor, "background").toBe("rgba(0, 0, 0, 0)");
				expect(c.paddingLeft, "padding-inline").toBe("0px");
				expect(c.paddingRight, "padding-inline").toBe("0px");
			}
			const left = root.getBoundingClientRect().left;
			expect(title.getBoundingClientRect().left).toBeCloseTo(left, 0);
			expect(body.getBoundingClientRect().left).toBeCloseTo(left, 0);
			expect(chevron.getBoundingClientRect().right).toBeCloseTo(
				root.getBoundingClientRect().right,
				0
			);
			expect(trigger.getBoundingClientRect().height).toBeGreaterThanOrEqual(touchTarget());
			expect(await checkA11y(screen.container)).toHaveNoViolations();
		});

		it("divided draws a subtle top border only on flush", async () => {
			const flush = await render(CollapsibleHarness, { variant: "flush", divided: true });
			const root = flush.container.querySelector(".ca-collapsible") as HTMLElement;
			expect(root.hasAttribute("data-divided")).toBe(true);
			expect(Number.parseFloat(css(root).borderTopWidth)).toBeGreaterThan(0);
			flush.unmount();
			const plain = await render(CollapsibleHarness, { variant: "flush" });
			const plainRoot = plain.container.querySelector(".ca-collapsible") as HTMLElement;
			expect(css(plainRoot).borderTopWidth).toBe("0px");
		});

		it("trigger reads --ca-glass-bg only under glass or frosted styles", async () => {
			const screen = await render(CollapsibleHarness, {});
			const trigger = screen.container.querySelector(".ca-collapsible__trigger") as HTMLElement;
			const root = document.documentElement;
			const prev = root.getAttribute("data-style");
			try {
				for (const style of ["solid", "flat", "outlined"]) {
					root.setAttribute("data-style", style);
					expect(css(trigger).backgroundColor, style).toBe("rgba(0, 0, 0, 0)");
				}
				for (const style of ["glass", "frosted"]) {
					root.setAttribute("data-style", style);
					expect(css(trigger).backgroundColor, style).not.toBe("rgba(0, 0, 0, 0)");
				}
			} finally {
				if (prev === null) root.removeAttribute("data-style");
				else root.setAttribute("data-style", prev);
			}
		});
	});
});
