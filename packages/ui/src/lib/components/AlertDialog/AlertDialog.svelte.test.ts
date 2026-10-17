import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import { setLocale } from "../../i18n/index.js";
import Harness from "./AlertDialog.test.svelte";
import Parts from "./AlertDialogParts.test.svelte";

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

describe("AlertDialog button props (#287)", () => {
	const openParts = async () => {
		await render(Parts, { mode: "props" });
		await page.getByRole("button", { name: "Delete item" }).click();
		await expect.element(page.getByRole("alertdialog")).toBeVisible();
		await settled();
	};

	it("confirmProps and cancelProps reach the buttons", async () => {
		await openParts();
		const confirm = document.querySelector<HTMLElement>('[data-testid="confirm-btn"]');
		const cancel = document.querySelector<HTMLElement>('[data-testid="cancel-btn"]');
		expect(confirm?.textContent?.trim()).toBe("Delete");
		expect(confirm?.id).toBe("confirm-id");
		expect(confirm?.classList.contains("ca-btn--destructive")).toBe(true);
		expect(cancel?.textContent?.trim()).toBe("Cancelar");
	});

	it("cancelVariant picks the cancel button variant", async () => {
		await openParts();
		await expect
			.element(page.getByRole("button", { name: "Cancelar" }))
			.toHaveClass("ca-btn--outlined");
		expect(await checkA11y(document.body)).toHaveNoViolations();
	});

	it("cancel keeps the ghost variant by default", async () => {
		await open();
		await expect
			.element(page.getByRole("button", { name: "Cancelar" }))
			.toHaveClass("ca-btn--ghost");
	});
});

describe("AlertDialog body and confirmDisabled (#278)", () => {
	const openBody = async (onconfirm = vi.fn()) => {
		await render(Parts, { mode: "body", onconfirm });
		await page.getByRole("button", { name: "Delete item" }).click();
		await expect.element(page.getByRole("alertdialog")).toBeVisible();
		await settled();
		return onconfirm;
	};

	it("renders children in the body and keeps the dialog name", async () => {
		await openBody();
		await expect.element(page.getByRole("alertdialog", { name: "Delete ITEM-1?" })).toBeVisible();
		await expect.element(page.getByLabelText("Type ITEM-1 to confirm")).toBeVisible();
		expect(document.querySelector(".ca-alert-dialog .ca-dialog__body")).not.toBeNull();
		expect(await checkA11y(document.body)).toHaveNoViolations();
	});

	it("confirmDisabled blocks confirm until the typed key matches", async () => {
		const onconfirm = await openBody();
		const confirm = page.getByRole("button", { name: "Delete", exact: true });
		await expect.element(confirm).toBeDisabled();
		await page.getByLabelText("Type ITEM-1 to confirm").fill("ITEM-1");
		await expect.element(confirm).toBeEnabled();
		expect(await checkA11y(document.body)).toHaveNoViolations();
		await confirm.click();
		expect(onconfirm).toHaveBeenCalledOnce();
		await expect.element(page.getByRole("alertdialog")).not.toBeInTheDocument();
	});

	it("Escape still cancels while confirm is disabled", async () => {
		await openBody();
		await userEvent.keyboard("{Escape}");
		await expect.element(page.getByRole("alertdialog")).not.toBeInTheDocument();
	});

	it("description accepts a snippet and still describes the dialog", async () => {
		await render(Parts, { mode: "rich" });
		await page.getByRole("button", { name: "Delete item" }).click();
		const dialog = page.getByRole("alertdialog", { name: "Delete item?" });
		await expect.element(dialog).toHaveAccessibleDescription("Removes 3 linked records too.");
		expect(document.querySelector(".ca-dialog__description strong")).not.toBeNull();
	});
});
