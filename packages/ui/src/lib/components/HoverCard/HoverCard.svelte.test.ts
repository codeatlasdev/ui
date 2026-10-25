import { afterEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import Harness from "./HoverCard.test.svelte";

const card = () => document.querySelector<HTMLElement>(".ca-hovercard-content");
const trigger = (screen: Awaited<ReturnType<typeof render>>) =>
	screen.getByRole("link", { name: "@ada" });

afterEach(() => {
	vi.useRealTimers();
});

describe("HoverCard", () => {
	it("is closed until hovered, then shows the card and describes the trigger", async () => {
		const screen = await render(Harness);
		await expect.element(page.getByText("Ada Lovelace")).not.toBeInTheDocument();
		await trigger(screen).hover();
		await expect.element(page.getByText("Ada Lovelace")).toBeVisible();
		const el = trigger(screen).element();
		expect(el.getAttribute("aria-describedby")).toBe(card()?.id);
		expect(card()?.getAttribute("role")).toBe("group");
		await settled();
		expect(await checkA11y(card() as HTMLElement)).toHaveNoViolations();
	});

	it("opens on keyboard focus without a delay and closes on blur", async () => {
		const screen = await render(Harness, { openDelay: 5000, closeDelay: 0 });
		await userEvent.tab();
		await userEvent.tab();
		await expect.element(trigger(screen)).toHaveFocus();
		await expect.element(page.getByText("Ada Lovelace")).toBeVisible();
		await userEvent.tab();
		await userEvent.tab();
		await expect.element(page.getByRole("button", { name: "After" })).toHaveFocus();
		await expect.element(page.getByText("Ada Lovelace")).not.toBeInTheDocument();
	});

	it("waits openDelay for the pointer, and a pointer that leaves first cancels it", async () => {
		// The open timer is a plain setTimeout: a fake clock installed BEFORE render owns it, so the
		// pointer round trips take any time under load and "still closed" is not a race.
		vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
		const screen = await render(Harness, { openDelay: 250 });
		const t = trigger(screen);
		await t.hover();
		await vi.advanceTimersByTimeAsync(249);
		expect(card()).toBeNull();
		await userEvent.unhover(t);
		await vi.advanceTimersByTimeAsync(1000);
		expect(card()).toBeNull();
		vi.useRealTimers();
		await t.hover();
		await expect.element(page.getByText("Ada Lovelace")).toBeVisible();
	});

	it("stays open while the pointer crosses into the card, closes after closeDelay when it leaves", async () => {
		const screen = await render(Harness, { closeDelay: 150 });
		const t = trigger(screen);
		await t.hover();
		await expect.element(page.getByText("Ada Lovelace")).toBeVisible();
		// Fake timers: the close timer only runs when the test advances it, so the two pointer
		// round-trips below can take any time under load (#466).
		vi.useFakeTimers();
		try {
			await userEvent.unhover(t);
			await userEvent.hover(page.getByText("Ada Lovelace"));
			vi.advanceTimersByTime(1000);
			expect(card()).not.toBeNull();
			await userEvent.unhover(page.getByText("Ada Lovelace"));
			vi.advanceTimersByTime(149);
			expect(card()).not.toBeNull();
			vi.advanceTimersByTime(1);
		} finally {
			vi.useRealTimers();
		}
		await expect.element(page.getByText("Ada Lovelace")).not.toBeInTheDocument();
	});

	it("Escape closes it and focus stays on the trigger", async () => {
		const screen = await render(Harness);
		await userEvent.tab();
		await userEvent.tab();
		await expect.element(page.getByText("Ada Lovelace")).toBeVisible();
		await userEvent.keyboard("{Escape}");
		await expect.element(page.getByText("Ada Lovelace")).not.toBeInTheDocument();
		await expect.element(trigger(screen)).toHaveFocus();
	});

	it("Tab from the trigger reaches a link inside the card", async () => {
		await render(Harness);
		await userEvent.tab();
		await userEvent.tab();
		await expect.element(page.getByText("Ada Lovelace")).toBeVisible();
		await userEvent.tab();
		await expect.element(page.getByRole("link", { name: "Follow" })).toHaveFocus();
		await expect.element(page.getByText("Ada Lovelace")).toBeVisible();
		await userEvent.keyboard("{Escape}");
		await expect.element(page.getByText("Ada Lovelace")).not.toBeInTheDocument();
		await expect.element(page.getByRole("link", { name: "@ada" })).toHaveFocus();
	});

	it("touch never opens it, so a tap only does the trigger's own action", async () => {
		vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
		const screen = await render(Harness);
		const el = trigger(screen).element();
		for (const type of ["pointerenter", "pointermove", "pointerdown"])
			el.dispatchEvent(new PointerEvent(type, { pointerType: "touch", bubbles: true }));
		await vi.advanceTimersByTimeAsync(2000);
		expect(card()).toBeNull();
	});

	it("reports user-driven changes through onOpenChange", async () => {
		const onOpenChange = vi.fn();
		const screen = await render(Harness, { onOpenChange });
		await trigger(screen).hover();
		await expect.element(page.getByText("Ada Lovelace")).toBeVisible();
		await userEvent.unhover(trigger(screen));
		await expect.element(page.getByText("Ada Lovelace")).not.toBeInTheDocument();
		expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
	});

	it("bind:open opens it from code", async () => {
		const screen = await render(Harness, { open: true });
		await expect.element(page.getByText("Ada Lovelace")).toBeVisible();
		await settled();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
		expect(await checkA11y(card() as HTMLElement)).toHaveNoViolations();
	});
});
