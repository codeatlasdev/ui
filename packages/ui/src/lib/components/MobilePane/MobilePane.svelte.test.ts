import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { VIEWPORTS } from "../../../../tests/viewports";
import { setLocale } from "../../i18n/index.js";
import Harness from "./MobilePane.test.svelte";

const open = async (props: { title?: string; richTitle?: boolean; onback?: () => void } = {}) => {
	await page.viewport(VIEWPORTS.mobile[0], VIEWPORTS.mobile[1]);
	const screen = await render(Harness, props);
	const trigger = screen.getByRole("button", { name: "Open pane" });
	await trigger.click();
	const pane = page.getByRole("dialog", { name: props.title ?? "Conversation" });
	await expect.element(pane).toBeVisible();
	return { screen, trigger, pane };
};

// These tests assert the Portuguese wording of the catalog.
beforeAll(() => setLocale("pt-BR"));
afterAll(() => setLocale("en"));

describe("MobilePane", () => {
	it("is closed by default and renders title, actions and body when open", async () => {
		await open();
		// A modal <dialog> moved to <body> (it does not inherit the page's typography).
		expect(document.body.querySelector(":scope > dialog.ca-mobile-pane")).not.toBeNull();
		await expect.element(page.getByText("Conversation", { exact: true }).first()).toBeVisible();
		await expect.element(page.getByRole("button", { name: "Action" })).toBeVisible();
		await expect.element(page.getByRole("textbox", { name: "Message" })).toBeVisible();
	});

	it("fills the screen above the shell with a contained scroller", async () => {
		await open();
		const pane = document.querySelector(".ca-mobile-pane") as HTMLElement;
		const cs = getComputedStyle(pane);
		expect(cs.position).toBe("fixed");
		expect(pane.getBoundingClientRect().width).toBe(window.innerWidth);
		expect(pane.getBoundingClientRect().height).toBe(window.innerHeight);
		const body = document.querySelector(".ca-mobile-pane__body") as HTMLElement;
		expect(getComputedStyle(body).overscrollBehaviorY).toBe("contain");
	});

	it("back button closes and calls onback", async () => {
		const onback = vi.fn();
		await open({ onback });
		await page.getByRole("button", { name: "Voltar" }).click();
		await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
		expect(onback).toHaveBeenCalledOnce();
	});

	it("Escape closes, calls onback and returns focus to the trigger", async () => {
		const onback = vi.fn();
		const { trigger } = await open({ onback });
		await expect.element(page.getByRole("dialog", { name: "Conversation" })).toHaveFocus();
		await userEvent.keyboard("{Escape}");
		await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
		expect(onback).toHaveBeenCalledOnce();
		await expect.element(trigger).toHaveFocus();
	});

	it("has no axe violations", async () => {
		await open();
		expect(await checkA11y(document.body)).toHaveNoViolations();
	});

	describe("header layout (no empty band above the header)", () => {
		const geometry = () => {
			const pane = document.querySelector(".ca-mobile-pane") as HTMLElement;
			const header = pane.querySelector(".ca-mobile-header") as HTMLElement;
			return { pane, header, p: pane.getBoundingClientRect(), h: header.getBoundingClientRect() };
		};

		it("sits at the top of the pane and is one 48px row without a safe area", async () => {
			await open();
			const { p, h } = geometry();
			expect(p.top).toBe(0);
			expect(h.top).toBe(0);
			expect(h.height).toBe(48);
		});

		it("grows by exactly the safe-area inset", async () => {
			document.documentElement.style.setProperty("--ca-safe-top", "59px");
			try {
				await open();
				const { h } = geometry();
				expect(h.top).toBe(0);
				expect(h.height).toBe(107);
			} finally {
				document.documentElement.style.removeProperty("--ca-safe-top");
			}
		});

		it("never scrolls the dialog itself, even when the focused field is revealed", async () => {
			await open();
			const { pane } = geometry();
			expect(getComputedStyle(pane).overflowY).toBe("clip");
			(pane.querySelector("input") as HTMLInputElement).focus();
			pane.querySelector("input")?.scrollIntoView({ block: "end" });
			expect(pane.scrollTop).toBe(0);
			expect(geometry().h.top).toBe(0);
		});

		for (const richTitle of [false, true]) {
			it(`truncates a very long ${richTitle ? "headerTitle" : "title"} in one row`, async () => {
				await open({ title: "A".repeat(120), richTitle });
				const { header, h } = geometry();
				expect(h.height).toBe(48);
				expect(header.scrollWidth).toBeLessThanOrEqual(header.clientWidth);
				for (const b of header.querySelectorAll("button")) {
					const r = b.getBoundingClientRect();
					expect(r.width).toBeGreaterThanOrEqual(32);
					expect(r.left).toBeGreaterThanOrEqual(0);
					expect(r.right).toBeLessThanOrEqual(window.innerWidth);
				}
			});
		}
	});
});
