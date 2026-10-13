import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import type { NotificationItem } from "./NotificationBell.svelte";
import Harness from "./NotificationBell.test.svelte";

const items: NotificationItem[] = [
	{ id: "1", title: "Payment approved", body: "R$ 120,00", time: "2 min ago", variant: "success" },
	{ id: "2", title: "Backup completed", read: true },
	{ id: "3", title: "Webhook failure", variant: "error" },
];

const openByKeyboard = async (props = {}) => {
	const screen = await render(Harness, props);
	const trigger = page.getByRole("button", { name: /^Notifications/ });
	(trigger.element() as HTMLElement).focus();
	await userEvent.keyboard("{Enter}");
	return { screen, trigger };
};

describe("NotificationBell", () => {
	it("trigger label reports the unread count", async () => {
		await render(Harness, { items });
		await expect
			.element(page.getByRole("button", { name: "Notifications (2 unread)" }))
			.toBeVisible();
	});

	it("opens from the keyboard listing notifications; no axe violations", async () => {
		const { trigger } = await openByKeyboard({ items });
		await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
		await expect.element(page.getByRole("button", { name: /Payment approved/ })).toBeVisible();
		await expect.element(page.getByRole("button", { name: /Backup completed/ })).toBeVisible();
		await settled();
		expect(
			await checkA11y(document.querySelector(".ca-notif-panel") as HTMLElement)
		).toHaveNoViolations();
	});

	it("Escape closes and returns focus to the trigger", async () => {
		const { trigger } = await openByKeyboard({ items });
		await expect.element(page.getByText("Notifications", { exact: true })).toBeVisible();
		await userEvent.keyboard("{Escape}");
		await expect.element(page.getByText("Notifications", { exact: true })).not.toBeInTheDocument();
		await expect.element(trigger).toHaveFocus();
		await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
	});

	it("clicking an unread item calls onRead; a read item does not", async () => {
		const onRead = vi.fn();
		await openByKeyboard({ items, onRead });
		await page.getByRole("button", { name: /Backup completed/ }).click();
		expect(onRead).not.toHaveBeenCalled();
		await page.getByRole("button", { name: /Payment approved/ }).click();
		expect(onRead).toHaveBeenCalledExactlyOnceWith("1");
	});

	it("mark-all and clear fire callbacks; mark-all hides when all read", async () => {
		const onReadAll = vi.fn();
		const onClear = vi.fn();
		await openByKeyboard({ items, onReadAll, onClear });
		await page.getByRole("button", { name: "Mark all read" }).click();
		await page.getByRole("button", { name: "Clear" }).click();
		expect(onReadAll).toHaveBeenCalledOnce();
		expect(onClear).toHaveBeenCalledOnce();
	});

	it("hides 'Mark all read' when everything is read", async () => {
		await openByKeyboard({ items: [{ id: "2", title: "Backup completed", read: true }] });
		await expect.element(page.getByRole("button", { name: "Clear" })).toBeVisible();
		await expect
			.element(page.getByRole("button", { name: "Mark all read" }))
			.not.toBeInTheDocument();
	});

	it("shows the empty state with no notifications", async () => {
		await openByKeyboard({ items: [] });
		await expect.element(page.getByText("No notifications")).toBeVisible();
	});
});
