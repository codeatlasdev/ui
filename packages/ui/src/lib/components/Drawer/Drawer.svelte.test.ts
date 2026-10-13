import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import { VIEWPORTS } from "../../../../tests/viewports";
import { setLocale } from "../../i18n/index.js";
import Harness from "./Drawer.test.svelte";

const open = async (props = {}) => {
	await page.viewport(...VIEWPORTS.desktop);
	const screen = await render(Harness, props);
	const trigger = screen.getByRole("button", { name: "Open filters" });
	await trigger.click();
	const dialog = page.getByRole("dialog", { name: "Filters" });
	await expect.element(dialog).toBeVisible();
	await settled();
	return { screen, trigger, dialog };
};

// These tests assert the Portuguese wording of the catalog.
beforeAll(() => setLocale("pt-BR"));
afterAll(() => setLocale("en"));

describe("Drawer", () => {
	it("opens with title, body and actions; no axe violations", async () => {
		await open();
		await expect.element(page.getByRole("button", { name: "Apply" })).toBeVisible();
		expect(await checkA11y(document.body)).toHaveNoViolations();
	});

	it("Escape closes and returns focus to the trigger", async () => {
		const { trigger } = await open();
		await userEvent.keyboard("{Escape}");
		await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
		await expect.element(trigger).toHaveFocus();
	});

	it("close button dismisses", async () => {
		await open();
		await page.getByRole("button", { name: "Fechar" }).click();
		await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
	});

	it("traps focus: Tab from the last focusable returns to the first", async () => {
		await open();
		const tabbables = [
			...document.querySelectorAll<HTMLElement>('[role="dialog"] button, [role="dialog"] input'),
		];
		const first = tabbables[0];
		const last = tabbables[tabbables.length - 1];
		last.focus();
		await userEvent.tab();
		expect(document.activeElement).toBe(first);
	});

	it.each([
		["right", (r: DOMRect) => Math.round(r.right) === VIEWPORTS.desktop[0]],
		["left", (r: DOMRect) => Math.round(r.left) === 0],
		["bottom", (r: DOMRect) => Math.round(r.bottom) === VIEWPORTS.desktop[1]],
	] as const)("side=%s is docked to that edge", async (side, docked) => {
		await open({ side });
		const rect = (document.querySelector(".ca-drawer") as HTMLElement).getBoundingClientRect();
		expect(docked(rect)).toBe(true);
	});
});
