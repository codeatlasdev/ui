import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { VIEWPORTS } from "../../../../tests/viewports";
import { setLocale } from "../../i18n/index.js";
import Harness from "./MobilePane.test.svelte";

const open = async (props = {}) => {
	await page.viewport(VIEWPORTS.mobile[0], VIEWPORTS.mobile[1]);
	const screen = await render(Harness, props);
	const trigger = screen.getByRole("button", { name: "Open pane" });
	await trigger.click();
	const pane = page.getByRole("dialog", { name: "Conversation" });
	await expect.element(pane).toBeVisible();
	return { screen, trigger, pane };
};

// These tests assert the Portuguese wording of the catalog.
beforeAll(() => setLocale("pt-BR"));
afterAll(() => setLocale("en"));

describe("MobilePane", () => {
	it("is closed by default and renders title, actions and body when open", async () => {
		const { screen } = await open();
		expect(screen.container.querySelector(".ca-mobile-pane")).not.toBeNull();
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
});
