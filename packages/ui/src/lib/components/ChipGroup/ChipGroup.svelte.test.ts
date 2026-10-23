import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import ChipGroupHarness from "./ChipGroupHarness.test.svelte";

const radio = (screen: Awaited<ReturnType<typeof render>>, name: string) =>
	screen.getByRole("radio", { name });

describe("ChipGroup", () => {
	it("is a labelled radiogroup; axe passes in default, selected and disabled", async () => {
		const plain = await render(ChipGroupHarness);
		await expect.element(plain.getByRole("radiogroup", { name: "Sales team size" })).toBeVisible();
		expect(await checkA11y(plain.container)).toHaveNoViolations();
		await plain.unmount();
		const picked = await render(ChipGroupHarness, { initial: "2-5" });
		await expect.element(radio(picked, "2 to 5")).toBeChecked();
		expect(await checkA11y(picked.container)).toHaveNoViolations();
		await picked.unmount();
		const off = await render(ChipGroupHarness, { initial: "2-5", disabled: true });
		await expect.element(radio(off, "2 to 5")).toBeDisabled();
		expect(await checkA11y(off.container)).toHaveNoViolations();
	});

	it("Tab enters on the first chip, or on the selected one, and leaves in one more Tab", async () => {
		const none = await render(ChipGroupHarness);
		await userEvent.tab();
		await expect.element(radio(none, "Just me")).toHaveFocus();
		await userEvent.tab();
		expect(none.container.contains(document.activeElement)).toBe(false);
		await none.unmount();
		const picked = await render(ChipGroupHarness, { initial: "6-20" });
		await userEvent.tab();
		await expect.element(radio(picked, "6 to 20")).toHaveFocus();
		await userEvent.tab();
		expect(picked.container.contains(document.activeElement)).toBe(false);
	});

	it("arrows, Home and End move focus and selection; Space selects", async () => {
		const onchange = vi.fn();
		const screen = await render(ChipGroupHarness, { initial: "2-5", onchange });
		radio(screen, "2 to 5").element().focus();
		await userEvent.keyboard("{ArrowRight}");
		await expect.element(radio(screen, "6 to 20")).toBeChecked();
		expect(onchange).toHaveBeenLastCalledWith("6-20");
		await userEvent.keyboard("{End}");
		await expect.element(radio(screen, "50+")).toBeChecked();
		await expect.element(radio(screen, "50+")).toHaveFocus();
		await userEvent.keyboard("{ArrowRight}");
		await expect.element(radio(screen, "Just me")).toBeChecked();
		await userEvent.keyboard("{ArrowLeft}");
		await expect.element(radio(screen, "50+")).toBeChecked();
		await userEvent.keyboard("{Home}");
		await expect.element(radio(screen, "Just me")).toBeChecked();
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("1");
	});

	it("Space and Enter select the focused chip", async () => {
		const screen = await render(ChipGroupHarness, { initial: "2-5" });
		radio(screen, "6 to 20").element().focus();
		await expect.element(radio(screen, "2 to 5")).toBeChecked();
		await userEvent.keyboard("{Enter}");
		await expect.element(radio(screen, "6 to 20")).toBeChecked();
		radio(screen, "50+").element().focus();
		await userEvent.keyboard(" ");
		await expect.element(radio(screen, "50+")).toBeChecked();
	});

	it("skips disabled items when moving", async () => {
		const screen = await render(ChipGroupHarness, {
			initial: "1",
			items: [
				{ value: "1", label: "Just me" },
				{ value: "2", label: "Two", disabled: true },
				{ value: "3", label: "Three" },
			],
		});
		radio(screen, "Just me").element().focus();
		await userEvent.keyboard("{ArrowRight}");
		await expect.element(radio(screen, "Three")).toBeChecked();
	});

	it("shows a check icon on the selected chip only", async () => {
		const screen = await render(ChipGroupHarness, { initial: "2-5" });
		const icons = screen.container.querySelectorAll(".ca-chip-group__check");
		expect(icons.length).toBe(1);
		expect(icons[0]?.closest("label")?.textContent).toContain("2 to 5");
	});

	it("error is an alert and wires aria-invalid + aria-describedby on the group", async () => {
		const screen = await render(ChipGroupHarness, { error: "Pick a team size" });
		const group = screen.getByRole("radiogroup");
		await expect.element(screen.getByRole("alert")).toHaveTextContent("Pick a team size");
		await expect.element(group).toHaveAttribute("aria-invalid", "true");
		const alertId = screen.getByRole("alert").element().id;
		expect(alertId).toBeTruthy();
		expect(group.element().getAttribute("aria-describedby")).toContain(alertId);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("description is announced through aria-describedby", async () => {
		const screen = await render(ChipGroupHarness, { description: "Used for pricing" });
		const id = screen.getByText("Used for pricing").element().id;
		expect(screen.getByRole("radiogroup").element().getAttribute("aria-describedby")).toBe(id);
	});

	it("submits the value in a native form via `name`", async () => {
		const screen = await render(ChipGroupHarness, { initial: "6-20" });
		const form = screen.getByTestId("form").element() as HTMLFormElement;
		expect(Object.fromEntries(new FormData(form))).toEqual({ teamSize: "6-20" });
		await radio(screen, "50+").click();
		expect(Object.fromEntries(new FormData(form))).toEqual({ teamSize: "50+" });
	});

	it("`required` blocks native submit until a chip is picked", async () => {
		const screen = await render(ChipGroupHarness, { required: true });
		const form = screen.getByTestId("form").element() as HTMLFormElement;
		expect(form.checkValidity()).toBe(false);
		await radio(screen, "Just me").click();
		expect(form.checkValidity()).toBe(true);
	});

	it("chips are at least 44px tall and 5 options never scroll horizontally at 390px", async () => {
		await page.viewport(390, 800);
		const screen = await render(ChipGroupHarness, { initial: "1" });
		const group = screen.getByRole("radiogroup").element() as HTMLElement;
		for (const label of group.querySelectorAll<HTMLElement>(".ca-chip-group__chip")) {
			expect(label.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
		}
		expect(group.scrollWidth).toBeLessThanOrEqual(group.clientWidth);
		const root = document.documentElement;
		expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
		const rows = new Set(
			Array.from(group.querySelectorAll<HTMLElement>(".ca-chip-group__chip")).map((el) =>
				Math.round(el.getBoundingClientRect().top)
			)
		);
		expect(rows.size).toBe(2);
	});
});
