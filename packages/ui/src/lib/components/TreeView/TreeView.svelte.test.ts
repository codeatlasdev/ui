import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import Harness from "./TreeViewHarness.test.svelte";

// #770: WAI-ARIA tree pattern.
describe("TreeView (#770)", () => {
	it("renders a named tree with levels; Tab lands on the first item", async () => {
		const screen = await render(Harness, {});
		await expect.element(screen.getByRole("tree", { name: "Files" })).toBeVisible();
		const src = screen.getByRole("treeitem", { name: "src" });
		await expect.element(src).toHaveAttribute("aria-level", "1");
		await expect.element(src).toHaveAttribute("aria-expanded", "false");
		await userEvent.keyboard("{Tab}");
		await expect.element(src).toHaveFocus();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("arrows expand, enter children, collapse and return to the parent", async () => {
		const screen = await render(Harness, {});
		(screen.getByRole("treeitem", { name: "src" }).element() as HTMLElement).focus();
		await userEvent.keyboard("{ArrowRight}");
		await expect
			.element(screen.getByRole("treeitem", { name: "src" }))
			.toHaveAttribute("aria-expanded", "true");
		await userEvent.keyboard("{ArrowRight}");
		await expect.element(screen.getByRole("treeitem", { name: "lib" })).toHaveFocus();
		await expect
			.element(screen.getByRole("treeitem", { name: "lib" }))
			.toHaveAttribute("aria-level", "2");
		await userEvent.keyboard("{ArrowDown}");
		await expect.element(screen.getByRole("treeitem", { name: "b.ts" })).toHaveFocus();
		await userEvent.keyboard("{ArrowLeft}");
		await expect.element(screen.getByRole("treeitem", { name: "src" })).toHaveFocus();
		await userEvent.keyboard("{ArrowLeft}");
		await expect
			.element(screen.getByRole("treeitem", { name: "src" }))
			.toHaveAttribute("aria-expanded", "false");
		await userEvent.keyboard("{End}");
		await expect.element(screen.getByRole("treeitem", { name: "package.json" })).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		await expect.element(screen.getByTestId("selected")).toHaveTextContent("pkg");
		await expect
			.element(screen.getByRole("treeitem", { name: "package.json" }))
			.toHaveAttribute("aria-selected", "true");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("loads children on first expand", async () => {
		const screen = await render(Harness, { lazy: true });
		await screen.getByRole("treeitem", { name: "docs" }).click();
		await expect.element(screen.getByRole("treeitem", { name: "intro.md" })).toBeVisible();
		await expect
			.element(screen.getByRole("treeitem", { name: "docs" }))
			.not.toHaveAttribute("aria-busy");
	});
});
