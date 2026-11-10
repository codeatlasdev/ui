import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { setLocale } from "../../i18n/index.js";
import Harness from "./MasterDetail.test.svelte";

beforeAll(() => setLocale("pt-BR"));
afterAll(() => setLocale("en"));

const text = (id: string) => document.querySelector(`[data-testid="${id}"]`)?.textContent;
const visible = (el: Element | null) =>
	!!el && el.getBoundingClientRect().width > 0 && getComputedStyle(el).visibility !== "hidden";

describe("MasterDetail (#744)", () => {
	it("wide: list and detail side by side, the empty state until a row is selected", async () => {
		await page.viewport(1440, 900);
		const screen = await render(Harness, { width: "1200px" });
		await expect.element(screen.getByText("Select a conversation")).toBeVisible();
		expect(screen.container.querySelector('[data-testid="thread"]')).toBeNull();
		await screen.getByRole("button", { name: "Open maria" }).click();
		await expect.element(screen.getByRole("textbox", { name: "Reply" })).toBeVisible();
		// The master keeps its width next to the detail.
		const list = screen.container.querySelector(".ca-md__master") as HTMLElement;
		const detail = screen.container.querySelector(".ca-md__detail") as HTMLElement;
		expect(list.getBoundingClientRect().right).toBeLessThanOrEqual(
			detail.getBoundingClientRect().left + 1
		);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("narrow: the list fills the screen and no empty detail sits beside it", async () => {
		await page.viewport(390, 844);
		const screen = await render(Harness, { width: "390px" });
		const list = screen.container.querySelector(".ca-md__master") as HTMLElement;
		expect(list.getBoundingClientRect().width).toBeGreaterThan(380);
		expect(visible(screen.container.querySelector(".ca-md__detail"))).toBe(false);
		await expect.element(screen.getByText("Select a conversation")).not.toBeVisible();
	});

	it("narrow: selecting opens the detail as a full-screen modal layer; back closes it and clears the selection", async () => {
		await page.viewport(390, 844);
		const onback = vi.fn();
		const screen = await render(Harness, { width: "390px", onback });
		await screen.getByRole("button", { name: "Open joao" }).click();
		const pane = page.getByRole("dialog", { name: "Chat joao" });
		await expect.element(pane).toBeVisible();
		const box = (document.querySelector(".ca-md__detail") as HTMLElement).getBoundingClientRect();
		expect(box.width).toBe(window.innerWidth);
		expect(box.height).toBe(window.innerHeight);
		await page.getByRole("button", { name: "Voltar" }).click();
		await expect.element(pane).not.toBeVisible();
		expect(text("selected")).toBe("none");
		expect(onback).toHaveBeenCalledOnce();
		await expect.element(page.getByRole("button", { name: "Open joao" })).toHaveFocus();
	});

	it("narrow: Escape closes the pane like the back button", async () => {
		await page.viewport(390, 844);
		const screen = await render(Harness, { width: "390px" });
		await screen.getByRole("button", { name: "Open ana" }).click();
		await expect.element(page.getByRole("dialog", { name: "Chat ana" })).toBeVisible();
		await userEvent.keyboard("{Escape}");
		await expect.poll(() => text("selected")).toBe("none");
	});

	it("one mount: crossing the breakpoint keeps the detail's DOM node and its draft", async () => {
		await page.viewport(1440, 900);
		const screen = await render(Harness, { width: "1200px", selected: "maria" });
		const reply = screen.getByRole("textbox", { name: "Reply" });
		await reply.fill("draft in progress");
		const node = document.querySelector('[data-testid="thread"]');
		const frame = document.querySelector('[data-testid="frame"]') as HTMLElement;
		frame.style.width = "390px";
		await expect.poll(() => visible(document.querySelector(".ca-md__detail"))).toBe(true);
		expect(document.querySelector('[data-testid="thread"]')).toBe(node);
		expect((document.querySelector('input[aria-label="Reply"]') as HTMLInputElement).value).toBe(
			"draft in progress"
		);
		expect(text("mounts")).toBe("1");
		frame.style.width = "1200px";
		await expect
			.poll(() => document.querySelector("dialog.ca-md__detail")?.matches(":modal"))
			.toBe(false);
		expect(document.querySelector('[data-testid="thread"]')).toBe(node);
	});

	it("the first paint is right without JavaScript layout: narrow container hides the detail before any effect", async () => {
		await page.viewport(390, 844);
		const screen = await render(Harness, { width: "390px" });
		const detail = screen.container.querySelector(".ca-md__detail") as HTMLElement;
		expect(getComputedStyle(detail).display).toBe("none");
	});

	it("a narrow pane has no axe violations", async () => {
		await page.viewport(390, 844);
		const screen = await render(Harness, { width: "390px", selected: "maria" });
		await expect.element(page.getByRole("dialog", { name: "Chat maria" })).toBeVisible();
		expect(await checkA11y(document.body)).toHaveNoViolations();
		screen.unmount();
	});
});
