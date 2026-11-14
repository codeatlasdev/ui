import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import RadioGroup from "./RadioGroup.svelte";
import RadioGroupHarness from "./RadioGroupHarness.test.svelte";

describe("RadioGroup", () => {
	it("exposes a radiogroup of labelled radios and axe passes", async () => {
		const screen = await render(RadioGroupHarness, { initial: "pro" });
		await expect.element(screen.getByRole("radiogroup")).toBeVisible();
		await expect
			.element(screen.getByRole("radio", { name: "Pro" }))
			.toHaveAttribute("aria-checked", "true");
		await expect
			.element(screen.getByRole("radio", { name: "Free" }))
			.toHaveAttribute("aria-checked", "false");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("arrow keys move selection and update the bound value", async () => {
		const onchange = vi.fn();
		const screen = await render(RadioGroupHarness, { initial: "free", onchange });
		screen.getByRole("radio", { name: "Free" }).element().focus();
		await userEvent.keyboard("{ArrowDown}");
		await expect
			.element(screen.getByRole("radio", { name: "Pro" }))
			.toHaveAttribute("aria-checked", "true");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("pro");
		expect(onchange).toHaveBeenLastCalledWith("pro");
		await userEvent.keyboard("{ArrowDown}");
		await expect
			.element(screen.getByRole("radio", { name: "Team" }))
			.toHaveAttribute("aria-checked", "true");
		await userEvent.keyboard("{ArrowUp}");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("pro");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("horizontal orientation uses ArrowRight/ArrowLeft", async () => {
		const screen = await render(RadioGroupHarness, { initial: "free", orientation: "horizontal" });
		screen.getByRole("radio", { name: "Free" }).element().focus();
		await userEvent.keyboard("{ArrowRight}");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("pro");
		await userEvent.keyboard("{ArrowLeft}");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("free");
	});

	it("clicking the label selects the radio", async () => {
		const screen = await render(RadioGroupHarness);
		await screen.getByText("Team").click();
		await expect.element(screen.getByRole("radio", { name: "Team" })).toBeChecked();
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("team");
	});

	it("disabled group ignores interaction", async () => {
		const onchange = vi.fn();
		const screen = await render(RadioGroupHarness, { disabled: true, onchange });
		await screen.getByRole("radio", { name: "Pro" }).click({ force: true });
		expect(onchange).not.toHaveBeenCalled();
	});
});

// #1062: `variant="cards"` filled the row with empty `auto-fill` tracks, so two cards in a wide dialog took
// ~40% of it and left the rest dead; there was no way to stack them in one column.
describe("RadioGroup cards layout", () => {
	const two = [
		{ value: "keep", label: "Keep data", description: "Reset the test but keep every answer." },
		{ value: "wipe", label: "Wipe data", description: "Reset the test and delete the answers." },
	];
	const cards = async (props: Record<string, unknown>, width = 900) => {
		const screen = await render(RadioGroup, { variant: "cards", "aria-label": "Mode", ...props });
		const box = screen.container as HTMLElement;
		box.style.width = `${width}px`;
		const group = box.querySelector('[role="radiogroup"]') as HTMLElement;
		const rects = [...group.querySelectorAll(".ca-radio-card")].map((c) =>
			c.getBoundingClientRect()
		);
		return { group: group.getBoundingClientRect(), rects };
	};

	it("by default the cards share the whole row", async () => {
		const { group, rects } = await cards({ items: two });
		expect(rects[0].top).toBe(rects[1].top);
		expect(rects[1].right).toBeCloseTo(group.right, 0);
	});

	it("columns={1} stacks every card at full width", async () => {
		const { group, rects } = await cards({ items: two, columns: 1 });
		expect(rects[1].top).toBeGreaterThan(rects[0].bottom - 1);
		for (const r of rects) expect(r.width).toBeCloseTo(group.width, 0);
	});

	it("columns={2} puts at most two cards on a row and stacks on a phone", async () => {
		const items = [...two, { value: "skip", label: "Skip", description: "Do nothing." }];
		const wide = await cards({ items, columns: 2 });
		expect(wide.rects[0].top).toBe(wide.rects[1].top);
		expect(wide.rects[2].top).toBeGreaterThan(wide.rects[0].bottom - 1);
		const narrow = await cards({ items, columns: 2 }, 280);
		expect(narrow.rects[1].top).toBeGreaterThan(narrow.rects[0].bottom - 1);
	});
});
