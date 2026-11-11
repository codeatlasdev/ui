import { createRawSnippet } from "svelte";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import { VIEWPORTS } from "../../../../tests/viewports";
import Dialog from "./Dialog.svelte";
import Harness from "./Dialog.test.svelte";
import DialogClosing from "./DialogClosing.test.svelte";

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

describe("Dialog closing (#732)", () => {
	it("a button revealed by closing is clickable at once, not after the exit animation", async () => {
		const screen = await render(DialogClosing);
		await screen.getByRole("button", { name: "Lose" }).click();
		await expect.element(page.getByRole("dialog")).toBeVisible();
		await settled();
		// Stretch the exit (#1009): at its real length it could end before the checks below on a loaded
		// machine, and the dialog was already gone ("expected undefined to be 'closed'").
		const slow = document.createElement("style");
		slow.textContent =
			'dialog.ca-overlay[data-state="closed"], dialog.ca-overlay[data-state="closed"] * { animation-duration: 60s !important; transition-duration: 60s !important; }';
		document.head.append(slow);
		const dialog = document.querySelector<HTMLElement>("dialog.ca-overlay");
		await page.getByRole("button", { name: "Confirm" }).click();
		const reopen = screen.getByRole("button", { name: "Reopen" });
		await expect.element(reopen).toBeInTheDocument();
		// The dialog is still mounted for its exit: the page must already receive the pointer.
		expect(dialog?.isConnected).toBe(true);
		expect(dialog?.dataset.state).toBe("closed");
		const r = reopen.element().getBoundingClientRect();
		const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
		expect(hit && reopen.element().contains(hit)).toBe(true);
		// Where the closing dialog is still painted, the page answers, not the dialog (#732). The button
		// above sits outside the dialog box, so that check alone passed with the dialog catching clicks (#1009).
		const d = dialog?.getBoundingClientRect();
		expect(d?.width).toBeGreaterThan(0);
		const under = d && document.elementFromPoint(d.left + d.width / 2, d.top + d.height / 2);
		expect(under).not.toBeNull();
		expect(dialog?.contains(under ?? null)).toBe(false);
		// The hit tests above are the contract (#732). A wall-clock bound on the click measured Playwright's round-trip
		// instead: 408 ms under a loaded run (#850).
		await reopen.click();
		await expect.element(screen.getByTestId("clicks")).toHaveTextContent("1");
		for (const a of dialog?.getAnimations({ subtree: true }) ?? []) a.finish();
		slow.remove();
	});

	it("focus lands on #main when the opener was removed during the exit", async () => {
		const screen = await render(DialogClosing);
		await screen.getByRole("button", { name: "Lose" }).click();
		await settled();
		await page.getByRole("button", { name: "Confirm" }).click();
		await expect.poll(() => document.activeElement?.id).toBe("main");
		void screen;
	});
});
