import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import { VIEWPORTS } from "../../../../tests/viewports";
import { setLocale } from "../../i18n/index.js";
import Harness from "./Sheet.test.svelte";

const open = async (props = {}) => {
	const screen = await render(Harness, props);
	const trigger = screen.getByRole("button", { name: "Open sheet" });
	await trigger.click();
	const dialog = page.getByRole("dialog", { name: "Switch session" });
	await expect.element(dialog).toBeVisible();
	return { screen, trigger, dialog };
};

// The close button label comes from the pt-BR catalog, so these tests run in that locale.
beforeAll(() => setLocale("pt-BR"));
afterAll(() => setLocale("en"));

describe("Sheet", () => {
	it("opens with title, description, body and footer; no axe violations", async () => {
		const { dialog } = await open();
		await expect.element(dialog).toHaveAccessibleDescription("Choose the active account");
		await expect.element(page.getByRole("button", { name: "Account A" })).toBeVisible();
		await expect.element(page.getByRole("button", { name: "New session" })).toBeVisible();
		await settled();
		expect(await checkA11y(document.body)).toHaveNoViolations();
	});

	it("Escape closes, calls onclose and returns focus to the trigger", async () => {
		const onclose = vi.fn();
		const { trigger } = await open({ onclose });
		await userEvent.keyboard("{Escape}");
		await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
		expect(onclose).toHaveBeenCalledOnce();
		await expect.element(trigger).toHaveFocus();
	});

	it("close button dismisses", async () => {
		const onclose = vi.fn();
		await open({ onclose });
		await page.getByRole("button", { name: "Fechar" }).click();
		await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
		expect(onclose).toHaveBeenCalledOnce();
	});

	it("traps focus: Tab from the last focusable returns to the first", async () => {
		await open();
		const tabbables = [...document.querySelectorAll<HTMLElement>('[role="dialog"] button')];
		const first = tabbables[0];
		const last = tabbables[tabbables.length - 1];
		last.focus();
		await userEvent.tab();
		expect(document.activeElement).toBe(first);
	});

	it("is anchored to the bottom edge at 390px", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		await open();
		await settled();
		const rect = (document.querySelector(".ca-sheet") as HTMLElement).getBoundingClientRect();
		expect(Math.round(rect.bottom)).toBe(VIEWPORTS.mobile[1]);
		expect(Math.round(rect.width)).toBe(VIEWPORTS.mobile[0]);
	});

	it("is a centered dialog at 1280px", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await open();
		await settled();
		const rect = (document.querySelector(".ca-sheet") as HTMLElement).getBoundingClientRect();
		expect(rect.width).toBeLessThanOrEqual(480);
		expect(Math.round(rect.left + rect.width / 2)).toBe(VIEWPORTS.desktop[0] / 2);
	});

	describe("swipe to dismiss (bottom sheet)", () => {
		/** Pointer event with a synthetic `timeStamp`: the component derives release velocity from it, so tests control speed without wall-clock waits. */
		const pointer = (type: string, y: number, t: number) => {
			const e = new PointerEvent(type, {
				bubbles: true,
				cancelable: true,
				composed: true,
				pointerId: 1,
				pointerType: "touch",
				isPrimary: true,
				clientX: 100,
				clientY: y,
			});
			Object.defineProperty(e, "timeStamp", { value: t });
			return e;
		};

		/** Drags the grab region down by `fraction` of the panel height over `duration` ms (synthetic clock), 10 moves. */
		function drag(fraction: number, duration: number) {
			const panel = document.querySelector(".ca-sheet") as HTMLElement;
			const grab = document.querySelector(".ca-sheet__grab") as HTMLElement;
			const distance = panel.getBoundingClientRect().height * fraction;
			const startY = grab.getBoundingClientRect().top + 8;
			const steps = 10;
			grab.dispatchEvent(pointer("pointerdown", startY, 0));
			for (let i = 1; i <= steps; i++) {
				grab.dispatchEvent(
					pointer("pointermove", startY + (distance * i) / steps, (duration * i) / steps)
				);
			}
			return { panel, grab, endY: startY + distance, endT: duration };
		}

		it("dragging the handle 40% down dismisses and fires onclose", async () => {
			await page.viewport(...VIEWPORTS.mobile);
			const onclose = vi.fn();
			await open({ onclose });
			await settled();
			const { grab, endY, endT } = drag(0.4, 400);
			grab.dispatchEvent(pointer("pointerup", endY, endT));
			await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
			expect(onclose).toHaveBeenCalledOnce();
		});

		it("the panel follows the finger and never overshoots upward", async () => {
			await page.viewport(...VIEWPORTS.mobile);
			await open();
			await settled();
			const panel = document.querySelector(".ca-sheet") as HTMLElement;
			const grab = document.querySelector(".ca-sheet__grab") as HTMLElement;
			const restTop = panel.getBoundingClientRect().top;
			const startY = grab.getBoundingClientRect().top + 8;
			grab.dispatchEvent(pointer("pointerdown", startY, 0));
			grab.dispatchEvent(pointer("pointermove", startY - 80, 10));
			await new Promise((r) => requestAnimationFrame(r));
			expect(panel.getBoundingClientRect().top).toBe(restTop);
			grab.dispatchEvent(pointer("pointermove", startY + 60, 20));
			await expect.poll(() => Math.round(panel.getBoundingClientRect().top - restTop)).toBe(60);
			grab.dispatchEvent(pointer("pointercancel", startY + 60, 30));
		});

		it("a slow 10% drag springs back and stays open", async () => {
			await page.viewport(...VIEWPORTS.mobile);
			const onclose = vi.fn();
			await open({ onclose });
			await settled();
			const { panel, grab, endY, endT } = drag(0.1, 600);
			grab.dispatchEvent(pointer("pointerup", endY, endT));
			await expect.element(page.getByRole("dialog")).toBeVisible();
			const restTop = window.innerHeight - panel.getBoundingClientRect().height;
			await expect
				.poll(() => Math.round(panel.getBoundingClientRect().top))
				.toBe(Math.round(restTop));
			expect(onclose).not.toHaveBeenCalled();
		});

		it("a fast flick (> 0.5 px/ms) dismisses even below 30%", async () => {
			await page.viewport(...VIEWPORTS.mobile);
			await open();
			await settled();
			const { grab, endY, endT } = drag(0.15, 30);
			grab.dispatchEvent(pointer("pointerup", endY, endT));
			await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
		});

		it("swipeToDismiss={false} ignores the drag", async () => {
			await page.viewport(...VIEWPORTS.mobile);
			await open({ swipeToDismiss: false });
			await settled();
			const { grab, endY, endT } = drag(0.6, 300);
			grab.dispatchEvent(pointer("pointerup", endY, endT));
			await expect.element(page.getByRole("dialog")).toBeVisible();
		});
	});

	// Real wheel/touch input isn't available in vitest browser mode (no `page.mouse`); the real-input
	// leak check runs in site/tests/scroll-lock.spec.ts. Here: the CSS/lock contract that
	// prevents the leak, plus a scrollY regression guard.
	it("while open, the page is locked and the overlay contains touch scrolling", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		// Render first, then append the filler: the trigger stays at the top and Playwright's click
		// does not scroll the page (which would look like a leak).
		await render(Harness, {});
		const filler = document.createElement("div");
		filler.style.height = "4000px";
		document.body.append(filler);
		const before = 0;
		try {
			await page.getByRole("button", { name: "Open sheet" }).click();
			await expect.element(page.getByRole("dialog", { name: "Switch session" })).toBeVisible();
			await settled();
			const overlay = document.querySelector(".ca-sheet__overlay") as HTMLElement;
			expect(getComputedStyle(overlay).touchAction).toBe("none");
			expect(getComputedStyle(overlay).overscrollBehaviorY).toBe("contain");
			expect(getComputedStyle(document.body).overflow).toBe("hidden");
			const body = document.querySelector(".ca-sheet__body") as HTMLElement;
			expect(getComputedStyle(body).overscrollBehaviorY).toBe("contain");
			overlay.dispatchEvent(
				new WheelEvent("wheel", { deltaY: 400, bubbles: true, cancelable: true })
			);
			await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
			expect(window.scrollY).toBe(before);
		} finally {
			await page.getByRole("button", { name: "Fechar" }).click();
			filler.remove();
		}
	});
});
