import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { touchTarget } from "../../../../tests/touch-target";
import AccordionHarness from "./AccordionHarness.test.svelte";

describe("Accordion", () => {
	it("starts collapsed and passes axe", async () => {
		const screen = await render(AccordionHarness, {});
		const first = screen.getByRole("button", { name: "First" });
		await expect.element(first).toHaveAttribute("aria-expanded", "false");
		await expect.element(screen.getByText("Content one")).not.toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("single: opening an item closes the previous one", async () => {
		const screen = await render(AccordionHarness, { type: "single" });
		const first = screen.getByRole("button", { name: "First" });
		const second = screen.getByRole("button", { name: "Second" });
		await first.click();
		await expect.element(first).toHaveAttribute("aria-expanded", "true");
		await expect.element(screen.getByText("Content one")).toBeVisible();
		await expect.element(screen.getByTestId("value")).toHaveTextContent('"one"');
		expect(await checkA11y(screen.container)).toHaveNoViolations();

		await second.click();
		await expect.element(second).toHaveAttribute("aria-expanded", "true");
		await expect.element(first).toHaveAttribute("aria-expanded", "false");
		await expect.element(screen.getByTestId("value")).toHaveTextContent('"two"');
	});

	it("single: clicking the open item collapses it", async () => {
		const screen = await render(AccordionHarness, { type: "single", value: "one" });
		const first = screen.getByRole("button", { name: "First" });
		await expect.element(first).toHaveAttribute("aria-expanded", "true");
		await first.click();
		await expect.element(first).toHaveAttribute("aria-expanded", "false");
	});

	it("multiple: several items stay open", async () => {
		const screen = await render(AccordionHarness, { type: "multiple" });
		await screen.getByRole("button", { name: "First" }).click();
		await screen.getByRole("button", { name: "Third" }).click();
		await expect
			.element(screen.getByRole("button", { name: "First" }))
			.toHaveAttribute("aria-expanded", "true");
		await expect
			.element(screen.getByRole("button", { name: "Third" }))
			.toHaveAttribute("aria-expanded", "true");
		await expect
			.element(screen.getByRole("button", { name: "Second" }))
			.toHaveAttribute("aria-expanded", "false");
		await expect.element(screen.getByTestId("value")).toHaveTextContent('["one","three"]');
	});

	it("arrow keys move focus between triggers, Enter/Space toggle", async () => {
		const screen = await render(AccordionHarness, {});
		(screen.getByRole("button", { name: "First" }).element() as HTMLElement).focus();
		await userEvent.keyboard("{ArrowDown}");
		await expect.element(screen.getByRole("button", { name: "Second" })).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		await expect
			.element(screen.getByRole("button", { name: "Second" }))
			.toHaveAttribute("aria-expanded", "true");
		await userEvent.keyboard("{ArrowUp}");
		await expect.element(screen.getByRole("button", { name: "First" })).toHaveFocus();
		await userEvent.keyboard(" ");
		await expect
			.element(screen.getByRole("button", { name: "First" }))
			.toHaveAttribute("aria-expanded", "true");
	});

	it("triggers are exposed inside headings", async () => {
		const screen = await render(AccordionHarness, {});
		await expect.element(screen.getByRole("heading", { level: 2, name: "First" })).toBeVisible();
		expect(screen.getByRole("heading", { level: 2 }).elements()).toHaveLength(3);
	});

	describe("variant", () => {
		const css = (el: Element) => getComputedStyle(el);

		it("boxed (default) keeps the box on every item", async () => {
			const screen = await render(AccordionHarness, { value: "one" });
			const root = screen.container.querySelector(".ca-accordion") as HTMLElement;
			const item = root.querySelector(".ca-accordion-item") as HTMLElement;
			expect(root.dataset.variant).toBe("boxed");
			expect(Number.parseFloat(css(item).borderTopWidth)).toBeGreaterThan(0);
			expect(Number.parseFloat(css(item).borderTopLeftRadius)).toBeGreaterThan(0);
		});

		it("flush has no border, radius, background or inline padding and aligns to the parent's left", async () => {
			const screen = await render(AccordionHarness, { variant: "flush", value: "one" });
			const root = screen.container.querySelector(".ca-accordion") as HTMLElement;
			expect(root.dataset.variant).toBe("flush");
			const left = root.getBoundingClientRect().left;
			const parts = [
				root,
				...root.querySelectorAll<HTMLElement>(
					".ca-accordion-item, .ca-accordion-item__trigger, .ca-accordion-item__body"
				),
			];
			for (const el of parts) {
				const c = css(el);
				expect(c.borderTopLeftRadius, "radius").toBe("0px");
				expect(c.borderLeftWidth, "border").toBe("0px");
				expect(c.borderRightWidth, "border").toBe("0px");
				expect(c.borderBottomWidth, "border").toBe("0px");
				expect(c.backgroundColor, "background").toBe("rgba(0, 0, 0, 0)");
				expect(c.paddingLeft, "padding-inline").toBe("0px");
				expect(c.paddingRight, "padding-inline").toBe("0px");
			}
			const title = root.querySelector(".ca-accordion-item__title") as HTMLElement;
			const body = root.querySelector(".ca-accordion-item__body") as HTMLElement;
			const chevron = root.querySelector(".ca-accordion-item__chevron") as HTMLElement;
			expect(title.getBoundingClientRect().left).toBeCloseTo(left, 0);
			expect(body.getBoundingClientRect().left).toBeCloseTo(left, 0);
			expect(chevron.getBoundingClientRect().right).toBeCloseTo(
				root.getBoundingClientRect().right,
				0
			);
			for (const t of root.querySelectorAll(".ca-accordion-item__trigger")) {
				expect(t.getBoundingClientRect().height).toBeGreaterThanOrEqual(touchTarget());
			}
			expect(await checkA11y(screen.container)).toHaveNoViolations();
		});

		it("divided draws a subtle top border between flush items, not above the first", async () => {
			const screen = await render(AccordionHarness, { variant: "flush", divided: true });
			const root = screen.container.querySelector(".ca-accordion") as HTMLElement;
			expect(root.hasAttribute("data-divided")).toBe(true);
			const items = root.querySelectorAll<HTMLElement>(".ca-accordion-item");
			expect(css(items[0]).borderTopWidth).toBe("0px");
			expect(Number.parseFloat(css(items[1]).borderTopWidth)).toBeGreaterThan(0);
			expect(Number.parseFloat(css(items[2]).borderTopWidth)).toBeGreaterThan(0);
		});

		it("without divided, flush items have no separator", async () => {
			const screen = await render(AccordionHarness, { variant: "flush" });
			for (const item of screen.container.querySelectorAll<HTMLElement>(".ca-accordion-item")) {
				expect(css(item).borderTopWidth).toBe("0px");
			}
		});
	});
});
