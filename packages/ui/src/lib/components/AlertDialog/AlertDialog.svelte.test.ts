import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import { setLocale } from "../../i18n/index.js";
import Harness from "./AlertDialog.test.svelte";

const open = async (props = {}) => {
	const screen = await render(Harness, props);
	const trigger = screen.getByRole("button", { name: "Delete item" });
	await trigger.click();
	const dialog = page.getByRole("alertdialog", { name: "Delete item?" });
	await expect.element(dialog).toBeVisible();
	return { screen, trigger, dialog };
};

// These tests assert the Portuguese wording of the catalog.
beforeAll(() => setLocale("pt-BR"));
afterAll(() => setLocale("en"));

describe("AlertDialog", () => {
	it("opens as alertdialog with description and no axe violations", async () => {
		const { dialog } = await open();
		await expect.element(dialog).toHaveAccessibleDescription("This action cannot be undone.");
		await settled();
		expect(await checkA11y(document.body)).toHaveNoViolations();
	});

	it("has no close (X) button", async () => {
		await open();
		expect(document.querySelector(".ca-layer-close")).toBeNull();
	});

	it("destructive applies ca-btn--destructive to the confirm button, otherwise filled", async () => {
		await open({ destructive: true });
		await expect
			.element(page.getByRole("button", { name: "Delete", exact: true }))
			.toHaveClass("ca-btn--destructive");
	});

	it("non-destructive confirm uses the filled variant", async () => {
		await open();
		await expect
			.element(page.getByRole("button", { name: "Delete", exact: true }))
			.toHaveClass("ca-btn--filled");
	});

	it("Cancel closes, calls oncancel and returns focus to the trigger", async () => {
		const oncancel = vi.fn();
		const { trigger } = await open({ oncancel });
		await page.getByRole("button", { name: "Cancelar" }).click();
		await expect.element(page.getByRole("alertdialog")).not.toBeInTheDocument();
		expect(oncancel).toHaveBeenCalledOnce();
		await expect.element(trigger).toHaveFocus();
	});

	it("Escape closes and counts as a cancel", async () => {
		const oncancel = vi.fn();
		await open({ oncancel });
		await userEvent.keyboard("{Escape}");
		await expect.element(page.getByRole("alertdialog")).not.toBeInTheDocument();
		expect(oncancel).toHaveBeenCalledOnce();
	});

	it("confirm runs onconfirm and closes", async () => {
		const onconfirm = vi.fn();
		await open({ onconfirm });
		await page.getByRole("button", { name: "Delete", exact: true }).click();
		expect(onconfirm).toHaveBeenCalledOnce();
		await expect.element(page.getByRole("alertdialog")).not.toBeInTheDocument();
	});

	it("pending disables Cancel, marks aria-busy and keeps the dialog open on Escape", async () => {
		const oncancel = vi.fn();
		const { dialog } = await open({ pending: true, oncancel });
		await expect.element(page.getByRole("button", { name: "Cancelar" })).toBeDisabled();
		await expect.element(dialog).toHaveAttribute("aria-busy", "true");
		await userEvent.keyboard("{Escape}");
		await expect.element(dialog).toBeVisible();
		expect(oncancel).not.toHaveBeenCalled();
	});

	it("async onconfirm keeps the dialog open and Cancel disabled until it resolves", async () => {
		let resolve!: () => void;
		const onconfirm = vi.fn(() => new Promise<void>((r) => (resolve = r)));
		const { dialog } = await open({ onconfirm });
		await page.getByRole("button", { name: "Delete", exact: true }).click();
		await expect.element(page.getByRole("button", { name: "Cancelar" })).toBeDisabled();
		await expect.element(dialog).toBeVisible();
		resolve();
		await expect.element(page.getByRole("alertdialog")).not.toBeInTheDocument();
	});
});
