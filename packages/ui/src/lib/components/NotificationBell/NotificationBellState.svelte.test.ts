import { afterEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import NotificationBell from "./NotificationBell.svelte";
import Harness from "./NotificationBellState.test.svelte";

const items = [
	{ id: "a", title: "New invoice" },
	{ id: "b", title: "Read receipt", read: true },
];
const trigger = () => page.getByRole("button", { name: /^Notifications/ });
const bound = () => page.getByRole("status", { name: "Bound open" });
const live = () => document.querySelector('[data-ca-announcer="polite"]');

afterEach(() => {
	for (const el of document.querySelectorAll("[data-ca-announcer]")) el.remove();
});

describe("NotificationBell state", () => {
	for (const mode of ["parent", "click"] as const) {
		it.each([
			{ count: 7, loading: true, items: [], label: "Notifications (7 unread)" },
			{ count: 7, loading: false, items: [], label: "Notifications (7 unread)" },
			{ count: 7, loading: true, items, label: "Notifications (7 unread)" },
			{ count: 7, loading: false, items, label: "Notifications (7 unread)" },
			{ count: undefined, loading: true, items: [], label: "Notifications (0 unread)" },
			{ count: undefined, loading: false, items: [], label: "Notifications (0 unread)" },
			{ count: undefined, loading: true, items, label: "Notifications (1 unread)" },
			{ count: undefined, loading: false, items, label: "Notifications (1 unread)" },
		])(`${mode}: combination %#`, async (row) => {
			const onOpenChange = vi.fn();
			const screen = await render(Harness, { ...row, onOpenChange });
			await expect.element(trigger()).toHaveAccessibleName(row.label);
			await expect.element(trigger()).toHaveAttribute("aria-expanded", "false");
			if (mode === "parent") await screen.rerender({ open: true });
			else await trigger().click();
			await expect.element(page.getByRole("dialog")).toBeVisible();
			await expect.element(bound()).toHaveTextContent("open");
			if (mode === "parent") expect(onOpenChange).not.toHaveBeenCalled();
			else expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
			if (row.loading)
				await expect
					.element(page.getByText("Loading notifications...", { exact: true }))
					.toBeVisible();
			else
				await expect
					.element(page.getByText("Loading notifications...", { exact: true }))
					.not.toBeInTheDocument();
			if (row.items.length)
				await expect.element(page.getByRole("button", { name: "New invoice" })).toBeVisible();
			else if (!row.loading)
				await expect.element(page.getByText("No notifications", { exact: true })).toBeVisible();
			if (row.loading || row.items.length)
				await expect
					.element(page.getByText("No notifications", { exact: true }))
					.not.toBeInTheDocument();
			if (row.count === 7 || row.items.length)
				await expect.element(page.getByRole("button", { name: "Mark all read" })).toBeVisible();
			else
				await expect
					.element(page.getByRole("button", { name: "Mark all read" }))
					.not.toBeInTheDocument();
			await userEvent.keyboard("{Escape}");
			await expect.element(bound()).toHaveTextContent("closed");
			await expect.element(trigger()).toHaveFocus();
			expect(onOpenChange.mock.calls).toEqual(mode === "parent" ? [[false]] : [[true], [false]]);
		});
	}

	it("parent updates count, including zero, and announces politely", async () => {
		const screen = await render(Harness, { count: 7, items });
		await expect.element(trigger()).toHaveAccessibleName("Notifications (7 unread)");
		await expect.element(page.getByText("7", { exact: true })).toBeVisible();
		await screen.rerender({ count: 3 });
		await expect.element(trigger()).toHaveAccessibleName("Notifications (3 unread)");
		await expect.element(page.getByText("3", { exact: true })).toBeVisible();
		await expect.poll(() => live()?.textContent).toBe("Notifications (3 unread)");
		expect(live()?.getAttribute("aria-live")).toBe("polite");
		await screen.rerender({ count: 0, open: true });
		await expect.element(trigger()).toHaveAccessibleName("Notifications (0 unread)");
		await expect.element(page.getByText("3", { exact: true })).not.toBeInTheDocument();
		await expect.element(page.getByText("7", { exact: true })).not.toBeInTheDocument();
		await expect
			.element(page.getByRole("status", { name: /^\d+ notifications$/ }))
			.not.toBeInTheDocument();
		await expect
			.element(page.getByRole("button", { name: "Mark all read" }))
			.not.toBeInTheDocument();
		await expect.poll(() => live()?.textContent).toBe("Notifications (0 unread)");
	});

	it("user opens a lazy list, marks read, and finishes loading", async () => {
		const onOpenChange = vi.fn();
		const onReadAll = vi.fn();
		const screen = await render(Harness, { count: 7, lazy: true, onOpenChange, onReadAll });
		await trigger().click();
		await expect.element(bound()).toHaveTextContent("open");
		await expect.element(page.getByText("Loading notifications...", { exact: true })).toBeVisible();
		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
		await screen.rerender({ loading: false, items });
		await expect.element(page.getByRole("button", { name: "New invoice" })).toBeVisible();
		await expect
			.element(page.getByText("Loading notifications...", { exact: true }))
			.not.toBeInTheDocument();
		await page.getByRole("button", { name: "Mark all read" }).click();
		expect(onReadAll).toHaveBeenCalledOnce();
		await expect.element(trigger()).toHaveAccessibleName("Notifications (0 unread)");
		await settled();
		expect(
			await checkA11y(document.querySelector(".ca-notif-panel") as HTMLElement)
		).toHaveNoViolations();
		await screen.rerender({ open: false });
		await expect.element(trigger()).toHaveAttribute("aria-expanded", "false");
		await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
	});

	it("trigger and outside dismiss update binding and callbacks", async () => {
		const onOpenChange = vi.fn();
		await render(Harness, { onOpenChange });
		await trigger().click();
		await expect.element(bound()).toHaveTextContent("open");
		await trigger().click();
		await expect.element(bound()).toHaveTextContent("closed");
		await trigger().click();
		await page.getByRole("button", { name: "Outside", exact: true }).click();
		await expect.element(bound()).toHaveTextContent("closed");
		await expect.element(page.getByRole("button", { name: "Outside", exact: true })).toHaveFocus();
		expect(onOpenChange.mock.calls).toEqual([[true], [false], [true], [false]]);
	});

	it("omitted props keep list counts, callbacks, and empty state", async () => {
		const onRead = vi.fn();
		const screen = await render(NotificationBell, { notifications: items, onRead });
		await expect.element(trigger()).toHaveAccessibleName("Notifications (1 unread)");
		await trigger().click();
		await page.getByRole("button", { name: "New invoice" }).click();
		expect(onRead).toHaveBeenCalledExactlyOnceWith("a");
		await screen.rerender({ notifications: [] });
		await expect.element(trigger()).toHaveAccessibleName("Notifications (0 unread)");
		await expect.element(page.getByText("No notifications", { exact: true })).toBeVisible();
	});

	it("parent close restores focus from a notification item", async () => {
		const onOpenChange = vi.fn();
		const screen = await render(Harness, { open: true, count: 7, items, onOpenChange });
		const item = page.getByRole("button", { name: "New invoice" });
		await expect.element(item).toBeVisible();
		(item.element() as HTMLElement).focus();
		await expect.element(item).toHaveFocus();
		await screen.rerender({ open: false });
		await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
		expect(onOpenChange).not.toHaveBeenCalled();
		await expect.element(trigger()).toHaveFocus();
	});

	it("parent close keeps focus already outside the panel", async () => {
		const onOpenChange = vi.fn();
		const screen = await render(Harness, { open: true, items, onOpenChange });
		await expect.element(page.getByRole("dialog")).toBeVisible();
		const outside = page.getByRole("button", { name: "Outside", exact: true });
		(outside.element() as HTMLElement).focus();
		await expect.element(outside).toHaveFocus();
		await expect.element(bound()).toHaveTextContent("open");
		await screen.rerender({ open: false });
		await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
		await expect.element(outside).toHaveFocus();
		expect(onOpenChange).not.toHaveBeenCalled();
	});

	it("lazy user close does not restart loading", async () => {
		const onOpenChange = vi.fn();
		const screen = await render(Harness, { lazy: true, onOpenChange });
		await trigger().click();
		await expect.element(page.getByText("Loading notifications...", { exact: true })).toBeVisible();
		await screen.rerender({ loading: false });
		await expect.element(page.getByText("No notifications", { exact: true })).toBeVisible();
		await trigger().click();
		await expect.element(bound()).toHaveTextContent("closed");
		expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
		await screen.rerender({ open: true });
		await expect.element(page.getByText("No notifications", { exact: true })).toBeVisible();
		await expect
			.element(page.getByText("Loading notifications...", { exact: true }))
			.not.toBeInTheDocument();
		expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
	});

	it("mark-all leaves the parent-owned count unchanged", async () => {
		const onReadAll = vi.fn();
		await render(Harness, { open: true, count: 7, lazy: false, onReadAll });
		await page.getByRole("button", { name: "Mark all read" }).click();
		expect(onReadAll).toHaveBeenCalledOnce();
		await expect.element(trigger()).toHaveAccessibleName("Notifications (7 unread)");
		await expect.element(page.getByText("7", { exact: true })).toBeVisible();
	});

	it("ending refresh clears loading with the same items", async () => {
		const screen = await render(Harness, { open: true, items });
		await expect.element(page.getByRole("button", { name: "New invoice" })).toBeVisible();
		await screen.rerender({ loading: true });
		await expect.element(page.getByText("Loading notifications...", { exact: true })).toBeVisible();
		await expect.element(page.getByRole("button", { name: "New invoice" })).toBeVisible();
		await screen.rerender({ loading: false });
		await expect
			.element(page.getByText("Loading notifications...", { exact: true }))
			.not.toBeInTheDocument();
		await expect.element(page.getByRole("button", { name: "New invoice" })).toBeVisible();
	});
});
