import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import { VIEWPORTS } from "../../../../tests/viewports";
import { setLocale } from "../../i18n/index.js";
import Harness from "./Drawer.test.svelte";
import Chromeless from "./DrawerChromeless.test.svelte";
import CustomHeader from "./DrawerCustomHeader.test.svelte";

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

describe("Drawer name (#285)", () => {
	const openCustom = async (mode: "labelledby" | "aria-label" | "hideTitle") => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(CustomHeader, { mode });
		await page.getByRole("button", { name: "Open item" }).click();
		await settled();
		return document.querySelector<HTMLElement>('[data-testid="item-drawer"]') as HTMLElement;
	};

	it("aria-labelledby names it from an own header", async () => {
		const dialog = await openCustom("labelledby");
		expect(dialog.getAttribute("aria-labelledby")).toBe("item-heading");
		await expect.element(page.getByRole("dialog", { name: "PRJ-42 Fix login" })).toBeVisible();
		expect(await checkA11y(document.body)).toHaveNoViolations();
	});

	it("forwards data-* and id to the dialog", async () => {
		const dialog = await openCustom("labelledby");
		expect(dialog.tagName).toBe("DIALOG");
		expect(dialog.id).toBe("item-drawer");
		expect(dialog.classList.contains("ca-drawer")).toBe(true);
	});

	it("aria-label names it, no title heading", async () => {
		const dialog = await openCustom("aria-label");
		expect(dialog.getAttribute("aria-label")).toBe("Item details");
		expect(dialog.hasAttribute("aria-labelledby")).toBe(false);
		expect(dialog.querySelector(".ca-drawer__title")).toBeNull();
		await expect.element(page.getByRole("dialog", { name: "Item details" })).toBeVisible();
		expect(await checkA11y(document.body)).toHaveNoViolations();
	});

	it("hideTitle keeps the name, hides the heading", async () => {
		await openCustom("hideTitle");
		await expect.element(page.getByRole("dialog", { name: "Item details" })).toBeVisible();
		const h = document.querySelector<HTMLElement>(".ca-drawer__title") as HTMLElement;
		expect(h.classList.contains("ca-sr-only")).toBe(true);
		expect(h.getBoundingClientRect().width).toBeLessThanOrEqual(1);
		expect(await checkA11y(document.body)).toHaveNoViolations();
	});
});

describe("Drawer chromeless and fullBleedBelow (#362)", () => {
	const openDetail = async (
		props: Record<string, unknown> = {},
		viewport: readonly [number, number] = VIEWPORTS.desktop
	) => {
		await page.viewport(...viewport);
		const screen = await render(Chromeless, props);
		const trigger = screen.getByRole("button", { name: "Open detail" });
		await trigger.click();
		await settled();
		const drawer = document.querySelector<HTMLElement>(
			'[data-testid="detail-drawer"]'
		) as HTMLElement;
		return { screen, trigger, drawer };
	};

	it("renders no header and a body with zero padding", async () => {
		const { drawer } = await openDetail();
		expect(drawer.querySelector(".ca-drawer__header")).toBeNull();
		expect(drawer.querySelector(".ca-layer-close")).toBeNull();
		const body = drawer.querySelector(".ca-drawer__body") as HTMLElement;
		expect(getComputedStyle(body).padding).toBe("0px");
	});

	it.each(["labelledby", "aria-label", "title"] as const)("is named through %s", async (naming) => {
		await openDetail({ naming });
		await expect.element(page.getByRole("dialog", { name: "Detail" })).toBeVisible();
		expect(await checkA11y(document.body)).toHaveNoViolations();
	});

	it("body is a flex column with min-height 0 so a child owns the scroll", async () => {
		const { drawer } = await openDetail();
		const body = drawer.querySelector(".ca-drawer__body") as HTMLElement;
		const cs = getComputedStyle(body);
		expect([cs.display, cs.flexDirection, cs.minHeight]).toEqual(["flex", "column", "0px"]);
		const scroller = drawer.querySelector<HTMLElement>('[data-testid="scroller"]') as HTMLElement;
		expect(scroller.scrollHeight).toBeGreaterThan(scroller.clientHeight);
		expect(body.scrollHeight).toBeLessThanOrEqual(body.clientHeight);
	});

	it("keeps Escape, focus restore and scroll lock", async () => {
		const { trigger } = await openDetail();
		expect(document.body.style.overflow).toBe("hidden");
		await userEvent.keyboard("{Escape}");
		await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
		await expect.element(trigger).toHaveFocus();
		expect(document.body.style.overflow).not.toBe("hidden");
	});

	it("traps focus inside its own controls", async () => {
		const { drawer } = await openDetail();
		const own = page.getByRole("button", { name: "Close detail" }).element() as HTMLElement;
		own.focus();
		await userEvent.tab();
		expect(drawer.contains(document.activeElement)).toBe(true);
		await userEvent.tab();
		expect(drawer.contains(document.activeElement)).toBe(true);
	});

	it("fullBleedBelow=sm fills the phone viewport: no strip, no radius, same height", async () => {
		const { drawer } = await openDetail({ fullBleedBelow: "sm" }, VIEWPORTS.mobile);
		const r = drawer.getBoundingClientRect();
		expect([r.left, r.right, r.top, r.bottom]).toEqual([
			0,
			VIEWPORTS.mobile[0],
			0,
			VIEWPORTS.mobile[1],
		]);
		const cs = getComputedStyle(drawer);
		expect(cs.borderTopLeftRadius).toBe("0px");
		expect(cs.borderBottomLeftRadius).toBe("0px");
		expect(await checkA11y(document.body)).toHaveNoViolations();
	});

	it("fullBleedBelow=sm leaves the panel docked at its width from sm up", async () => {
		const { drawer } = await openDetail({ fullBleedBelow: "sm" }, VIEWPORTS.tablet);
		await settled();
		expect(window.innerWidth).toBe(VIEWPORTS.tablet[0]);
		const r = drawer.getBoundingClientRect();
		const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
		expect(Math.round(r.width)).toBe(Math.round(26 * rem));
		expect(r.right).toBe(VIEWPORTS.tablet[0]);
	});

	it("without fullBleedBelow the phone keeps the 48px strip", async () => {
		const { drawer } = await openDetail({}, VIEWPORTS.mobile);
		expect(drawer.getBoundingClientRect().left).toBe(48);
	});

	it("fullBleedBelow keeps safe-area padding on the panel", async () => {
		const root = document.documentElement;
		root.style.setProperty("--ca-safe-top", "20px");
		root.style.setProperty("--ca-safe-bottom", "34px");
		try {
			const { drawer } = await openDetail({ fullBleedBelow: "sm" }, VIEWPORTS.mobile);
			const cs = getComputedStyle(drawer);
			expect([cs.paddingTop, cs.paddingBottom]).toEqual(["20px", "34px"]);
			const r = drawer.getBoundingClientRect();
			expect([r.width, r.height]).toEqual([...VIEWPORTS.mobile]);
		} finally {
			root.style.removeProperty("--ca-safe-top");
			root.style.removeProperty("--ca-safe-bottom");
		}
	});
});
