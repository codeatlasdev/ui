import { createRawSnippet } from "svelte";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import { VIEWPORTS } from "../../../../tests/viewports";
import Dialog from "./Dialog.svelte";
import Harness from "./Dialog.test.svelte";

describe("Dialog", () => {
	it("opens from the trigger with accessible name and description, no axe violations", async () => {
		const screen = await render(Harness);
		await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();

		await screen.getByRole("button", { name: "Open" }).click();
		const dialog = page.getByRole("dialog", { name: "Edit profile" });
		await expect.element(dialog).toBeVisible();
		await expect.element(dialog).toHaveAccessibleDescription("Update your details.");
		await settled();
		expect(await checkA11y(document.body)).toHaveNoViolations();
	});

	it("traps focus: Tab from the last focusable returns to the first", async () => {
		const screen = await render(Harness);
		await screen.getByRole("button", { name: "Open" }).click();
		const dialog = page.getByRole("dialog");
		await expect.element(dialog).toBeVisible();

		const close = page.getByRole("button", { name: "Close" });
		const save = page.getByRole("button", { name: "Save" });
		const tabbables = [
			...document.querySelectorAll<HTMLElement>('[role="dialog"] button, [role="dialog"] input'),
		];
		const first = tabbables[0];
		const last = tabbables[tabbables.length - 1];
		expect(first).toBe(close.element());
		expect(last).toBe(save.element());

		last.focus();
		await userEvent.tab();
		expect(document.activeElement).toBe(first);

		await userEvent.tab({ shift: true });
		expect(document.activeElement).toBe(last);
	});

	it("Escape closes and focus returns to the trigger", async () => {
		const onOpenChange = vi.fn();
		const screen = await render(Harness, { onOpenChange });
		const trigger = screen.getByRole("button", { name: "Open" });
		await trigger.click();
		await expect.element(page.getByRole("dialog")).toBeVisible();

		await userEvent.keyboard("{Escape}");
		await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
		await expect.element(trigger).toHaveFocus();
	});

	it("close button dismisses the dialog", async () => {
		const screen = await render(Harness);
		await screen.getByRole("button", { name: "Open" }).click();
		await page.getByRole("button", { name: "Close" }).click();
		await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
	});

	it("chromeless has no header or close button but keeps the accessible name", async () => {
		const screen = await render(Harness, { chromeless: true });
		await screen.getByRole("button", { name: "Open" }).click();
		const dialog = page.getByRole("dialog", { name: "Edit profile" });
		await expect.element(dialog).toBeVisible();
		expect(document.querySelector(".ca-dialog__header")).toBeNull();
		await expect.element(page.getByRole("button", { name: "Close" })).not.toBeInTheDocument();
		await expect.element(page.getByRole("button", { name: "Save" })).not.toBeInTheDocument();
		await settled();
		expect(await checkA11y(document.body)).toHaveNoViolations();
	});

	it("size=split is a two-column grid at desktop width", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, { size: "split" });
		await screen.getByRole("button", { name: "Open" }).click();
		await expect.element(page.getByRole("dialog")).toBeVisible();
		const body = document.querySelector<HTMLElement>(".ca-dialog__body");
		const cs = getComputedStyle(body as HTMLElement);
		expect(cs.display).toBe("grid");
		expect(cs.gridTemplateColumns.split(" ")).toHaveLength(2);
	});

	it("size=split collapses to a single column at 390px", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		const screen = await render(Harness, { size: "split" });
		await screen.getByRole("button", { name: "Open" }).click();
		await expect.element(page.getByRole("dialog")).toBeVisible();
		const body = document.querySelector<HTMLElement>(".ca-dialog__body");
		const cs = getComputedStyle(body as HTMLElement);
		expect(cs.display).not.toBe("grid");
		expect(cs.display).toBe("block");
	});

	it("warns in dev when an open dialog has no title", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		await render(Dialog, {
			open: true,
			children: createRawSnippet(() => ({ render: () => "<p>Body</p>" })),
		});
		await expect.element(page.getByRole("dialog")).toBeVisible();
		expect(warn).toHaveBeenCalledWith(expect.stringMatching(/^\[ca-ui\] <Dialog> has no `title`/));
		warn.mockRestore();
	});
});
