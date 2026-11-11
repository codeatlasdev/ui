import { afterEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import { VIEWPORTS } from "../../../../tests/viewports";
import type { NotificationItem } from "./NotificationBell.svelte";
import Harness from "./NotificationBellLayout.test.svelte";

const LONG =
	"Your export of the last twelve months of transactions finished and the file is ready to download from the reports page, where it stays available for thirty days.";
const items: NotificationItem[] = [
	{
		id: "1",
		title: "Export ready",
		body: LONG,
		time: "2 min ago",
		variant: "success",
		href: "/reports",
	},
	{ id: "2", title: "Backup completed", read: true, href: "/backups" },
	{ id: "3", title: "Webhook failure", variant: "error" },
];
const trigger = () => page.getByRole("button", { name: /notifications$/i });
const panel = () => document.querySelector(".ca-notif-panel") as HTMLElement;
const open = async (props: Record<string, unknown> = {}) => {
	const screen = await render(Harness, { items, ...props });
	await trigger().click();
	await expect.element(page.getByRole("dialog")).toBeVisible();
	await settled();
	return screen;
};

afterEach(async () => {
	await page.viewport(...VIEWPORTS.desktop);
});

describe("NotificationBell placement and width", () => {
	it("a bell at the bottom of a left rail opens to its right, inside the viewport", async () => {
		for (const [w, h] of [VIEWPORTS.desktop, VIEWPORTS.mobile]) {
			await page.viewport(w, h);
			const screen = await open({ rail: true, side: "right", align: "end" });
			const t = (trigger().element() as HTMLElement).getBoundingClientRect();
			const p = panel().getBoundingClientRect();
			expect(p.left).toBeGreaterThanOrEqual(t.right - 1);
			expect(p.left).toBeGreaterThanOrEqual(0);
			expect(p.right).toBeLessThanOrEqual(window.innerWidth + 0.5);
			expect(p.top).toBeGreaterThanOrEqual(0);
			expect(p.bottom).toBeLessThanOrEqual(window.innerHeight + 0.5);
			expect(panel().dataset.side).toBe("right");
			screen.unmount();
		}
	});

	it("side=top opens above the trigger", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await open({ rail: true, side: "top", align: "start" });
		const t = (trigger().element() as HTMLElement).getBoundingClientRect();
		expect(panel().getBoundingClientRect().bottom).toBeLessThanOrEqual(t.top + 1);
		expect(panel().dataset.side).toBe("top");
	});

	it("sideOffset moves the panel away from the trigger", async () => {
		await open({ sideOffset: 40 });
		const t = (trigger().element() as HTMLElement).getBoundingClientRect();
		expect(Math.round(panel().getBoundingClientRect().top - t.bottom)).toBeGreaterThanOrEqual(39);
	});

	it("default placement is unchanged: bottom, end, 340px wide, 8px offset", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(Harness, { items });
		await trigger().click();
		await settled();
		const t = (trigger().element() as HTMLElement).getBoundingClientRect();
		const p = panel().getBoundingClientRect();
		expect(panel().dataset.side).toBe("bottom");
		expect(panel().dataset.align).toBe("end");
		expect(Math.round(p.width)).toBe(340);
		expect(Math.round(p.top - t.bottom)).toBe(8);
	});

	it("width sets the panel width; a narrow viewport never clips it", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await open({ width: "420px" });
		expect(Math.round(panel().getBoundingClientRect().width)).toBe(420);
		document.body.innerHTML = "";
		await page.viewport(320, 640);
		await render(Harness, { items, width: "420px" });
		await trigger().click();
		await settled();
		const p = panel().getBoundingClientRect();
		expect(p.left).toBeGreaterThanOrEqual(0);
		expect(p.right).toBeLessThanOrEqual(320 + 0.5);
	});
});

describe("NotificationBell rich rows", () => {
	it("wraps a long body instead of cutting it to one line", async () => {
		await open();
		const text = document.querySelector(".ca-notif-item__text") as HTMLElement;
		expect(getComputedStyle(text).whiteSpace).not.toBe("nowrap");
		const lh = Number.parseFloat(getComputedStyle(text).lineHeight);
		expect(text.getBoundingClientRect().height).toBeGreaterThan(lh * 1.5);
	});

	it("an item with href renders a link and a separate mark-as-read button", async () => {
		const onRead = vi.fn();
		await open({ onRead });
		const link = page.getByRole("link", { name: /Export ready/ });
		await expect.element(link).toHaveAttribute("href", "/reports");
		await page.getByRole("button", { name: "Mark Export ready as read" }).click();
		expect(onRead).toHaveBeenCalledExactlyOnceWith("1");
		// A read item has a link but no mark-as-read action.
		await expect.element(page.getByRole("link", { name: /Backup completed/ })).toBeVisible();
		await expect
			.element(page.getByRole("button", { name: "Mark Backup completed as read" }))
			.not.toBeInTheDocument();
		// Following the link does not mark it read; the app decides.
		await expect.element(page.getByRole("button", { name: /Webhook failure/ })).toBeVisible();
	});

	it("renders the per-item icon in place of the dot", async () => {
		await open({ withIcons: true });
		expect(document.querySelectorAll(".ca-notif-item__icon").length).toBe(3);
		expect(document.querySelector(".ca-notif-item__icon svg")?.getAttribute("aria-hidden")).toBe(
			"true"
		);
	});

	it("the item snippet owns the row and receives close and markRead", async () => {
		const onRead = vi.fn();
		await open({ withItem: true, onRead });
		await expect.element(page.getByTestId("custom-row-1")).toBeVisible();
		expect(document.querySelector(".ca-notif-item__btn")).toBeNull();
		await page.getByRole("button", { name: "custom-read" }).first().click();
		expect(onRead).toHaveBeenCalledExactlyOnceWith("1");
		await page.getByRole("button", { name: "custom-close" }).first().click();
		await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
		await expect.element(trigger()).toHaveFocus();
	});

	it("rich rows have no axe violations", async () => {
		await open({ withIcons: true, onRead: () => {} });
		expect(await checkA11y(panel())).toHaveNoViolations();
	});
});

describe("NotificationBell header actions", () => {
	it("hides Clear when onClear is not passed, shows it when it is", async () => {
		const screen = await open();
		await expect.element(page.getByRole("button", { name: "Clear" })).not.toBeInTheDocument();
		screen.unmount();
		const onClear = vi.fn();
		await open({ onClear });
		await page.getByRole("button", { name: "Clear" }).click();
		expect(onClear).toHaveBeenCalledOnce();
	});

	it("header actions are ghost Buttons at the touch target on a coarse pointer", async () => {
		await open({ onClear: () => {}, onReadAll: () => {} });
		const markAll = page.getByRole("button", { name: "Mark all read" }).element();
		expect(markAll.classList.contains("ca-btn")).toBe(true);
		expect(markAll.classList.contains("ca-notif-action")).toBe(true);
	});
});

describe("NotificationBell states", () => {
	it("shows an error with a retry button that calls onRetry", async () => {
		const onRetry = vi.fn();
		await open({ items: [], error: { onRetry } });
		await expect
			.element(page.getByRole("alert").getByText("Could not load notifications", { exact: true }))
			.toBeVisible();
		await expect
			.element(page.getByText("No notifications", { exact: true }))
			.not.toBeInTheDocument();
		await page.getByRole("button", { name: "Try again" }).click();
		expect(onRetry).toHaveBeenCalledOnce();
		expect(await checkA11y(panel())).toHaveNoViolations();
	});

	it("error without onRetry has no retry button; a custom message replaces the text", async () => {
		await open({ items: [], error: { message: "Offline" } });
		await expect
			.element(page.getByRole("alert").getByText("Offline", { exact: true }))
			.toBeVisible();
		await expect.element(page.getByRole("button", { name: "Try again" })).not.toBeInTheDocument();
	});

	it("error keeps loaded notifications visible", async () => {
		await open({ error: { onRetry: () => {} } });
		await expect.element(page.getByRole("alert")).toBeVisible();
		await expect.element(page.getByRole("button", { name: /Webhook failure/ })).toBeVisible();
	});

	it("loading wins over error", async () => {
		await open({ items: [], loading: true, error: { onRetry: () => {} } });
		await expect.element(page.getByText("Loading notifications...")).toBeVisible();
		await expect.element(page.getByRole("alert")).not.toBeInTheDocument();
	});

	it("emptyContent replaces the empty string", async () => {
		await open({ items: [], withEmptyContent: true });
		await expect.element(page.getByTestId("custom-empty")).toBeVisible();
		await expect
			.element(page.getByText("No notifications", { exact: true }))
			.not.toBeInTheDocument();
	});
});

describe("NotificationBell badge cap", () => {
	it("max caps the badge text with a plus; the accessible name keeps the real count", async () => {
		await render(Harness, { items: [], count: 250, max: 9 });
		await expect
			.element(page.getByRole("button", { name: "250 unread notifications" }))
			.toBeVisible();
		await expect.element(page.getByText("9+", { exact: true })).toBeVisible();
	});

	it("max defaults to 99", async () => {
		await render(Harness, { items: [], count: 250 });
		await expect.element(page.getByText("99+", { exact: true })).toBeVisible();
	});

	it("a count at or below max is shown as is", async () => {
		await render(Harness, { items: [], count: 9, max: 9 });
		await expect.element(page.getByText("9", { exact: true })).toBeVisible();
	});
});

describe("NotificationBell keyboard", () => {
	it("Tab reaches the link and then the mark-as-read button of a row", async () => {
		await open({ onRead: () => {} });
		(page.getByRole("link", { name: /Export ready/ }).element() as HTMLElement).focus();
		await userEvent.keyboard("{Tab}");
		await expect
			.element(page.getByRole("button", { name: "Mark Export ready as read" }))
			.toHaveFocus();
	});
});
