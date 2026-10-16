import type { Page } from "@playwright/test";
import { expect, expectNoViolations, gotoReady, makeAxe, settle, test } from "./fixtures";

// Every transitions demo: plays in view, a touch takes over and the user drives the effect,
// reduced motion renders the final state, axe is clean in each state.
const PAGE = "/docs/motion/transitions/";

const demos = [
	{ name: "Shared element", label: /^Shared element:/ },
	{ name: "FLIP reorder", label: /^FLIP reorder:/ },
	{ name: "Height spring", label: /^Height spring:/ },
	{ name: "Tab indicator", label: /^Tab indicator:/ },
	{ name: "Stacked toasts", label: /^Stacked toasts:/ },
	{ name: "Sheet spring", label: /^Sheet spring:/ },
	{ name: "Filter list", label: /^Filter list:/ },
] as const;

/** Stops every other stage's autoplay (their own Pause button) so axe never scans a control mid-motion. */
async function quiet(page: Page, except: RegExp) {
	for (const g of await page
		.getByRole("group", {
			name: /^(Shared element|FLIP reorder|Height spring|Tab indicator|Stacked toasts|Sheet spring|Filter list|Fade rise):/,
		})
		.all()) {
		const name = (await g.getAttribute("aria-label")) ?? "";
		if (except.test(name)) continue;
		const pause = g.getByRole("button", { name: "Pause" });
		if ((await pause.count()) && (await pause.getAttribute("aria-pressed")) !== "true")
			await pause.click();
	}
}

test.describe("motion transitions: in view and axe", () => {
	test.use({ reducedMotion: "no-preference" });

	for (const d of demos) {
		test(`${d.name} plays in view and is axe clean`, async ({ page }, testInfo) => {
			await gotoReady(page, PAGE);
			const stage = page.getByRole("group", { name: d.label });
			await stage.scrollIntoViewIfNeeded();
			await expect(stage).toHaveAttribute("data-playing", "true");
			await expect(stage).toHaveAttribute("data-reduced", "false");
			await settle(page);
			await expectNoViolations(await makeAxe(page).analyze(), testInfo, `${d.name} playing`);
		});
	}
});

test.describe("motion transitions: takeover", () => {
	test.use({ reducedMotion: "no-preference" });

	async function take(page: Page, label: RegExp) {
		await gotoReady(page, PAGE);
		const stage = page.getByRole("group", { name: label });
		await stage.scrollIntoViewIfNeeded();
		await expect(stage).toHaveAttribute("data-playing", "true");
		return stage;
	}

	test("Shared element: opening a plan shows its detail", async ({ page }, testInfo) => {
		const stage = await take(page, /^Shared element:/);
		await stage
			.getByRole("button", { name: /^Open (Orbit Team|Atlas Pro)$/ })
			.first()
			.waitFor();
		await stage
			.getByRole("button", { name: "Open Orbit Team" })
			.click()
			.catch(async () => {
				// The loop may already show the detail: go back first, then open.
				await stage.getByRole("button", { name: "Back to plans" }).click();
				await stage.getByRole("button", { name: "Open Orbit Team" }).click();
			});
		await expect(stage).toHaveAttribute("data-taken", "true");
		await expect(stage.getByText("5 seats, shared inbox")).toBeVisible();
		await quiet(page, /^$/);
		await settle(page);
		await expectNoViolations(await makeAxe(page).analyze(), testInfo, "shared taken");
		await stage.getByRole("button", { name: "Back to plans" }).click();
		await expect(stage.getByRole("button", { name: "Open Orbit Team" })).toBeVisible();
	});

	test("FLIP reorder: picking a sort reorders the rows", async ({ page }, testInfo) => {
		const stage = await take(page, /^FLIP reorder:/);
		await stage.getByRole("button", { name: "Churn" }).click();
		await expect(stage).toHaveAttribute("data-taken", "true");
		await expect(stage.getByRole("button", { name: "Churn" })).toHaveAttribute(
			"aria-pressed",
			"true"
		);
		await expect(stage.locator(".fl__row").first()).toContainText("Initech");
		await stage.getByRole("button", { name: "MRR" }).click();
		await expect(stage.locator(".fl__row").first()).toContainText("Hooli");
		await quiet(page, /^$/);
		await settle(page);
		await expectNoViolations(await makeAxe(page).analyze(), testInfo, "flip taken");
	});

	test("Height spring: a trigger opens its panel to the measured height", async ({
		page,
	}, testInfo) => {
		const stage = await take(page, /^Height spring:/);
		const trigger = stage.getByRole("button", { name: "How do I export my data?" });
		// The loop may already have it open: a click would close it. Take over on another one first.
		await stage.getByRole("button", { name: "When am I billed?" }).click();
		await expect(stage).toHaveAttribute("data-taken", "true");
		if ((await trigger.getAttribute("aria-expanded")) !== "true") await trigger.click();
		await expect(trigger).toHaveAttribute("aria-expanded", "true");
		const panel = stage.getByRole("region", { name: "How do I export my data?" });
		await expect
			.poll(async () => {
				const [clip, body] = await Promise.all([
					panel.evaluate((n) => n.getBoundingClientRect().height),
					panel.locator(".hs__body").evaluate((n) => n.scrollHeight),
				]);
				return Math.abs(clip - body) < 1.5;
			})
			.toBe(true);
		await quiet(page, /^$/);
		await settle(page);
		await expectNoViolations(await makeAxe(page).analyze(), testInfo, "height taken");
		await trigger.click();
		await expect(trigger).toHaveAttribute("aria-expanded", "false");
		await expect
			.poll(() => panel.evaluate((n) => n.getBoundingClientRect().height))
			.toBeLessThan(1);
	});

	test("Tab indicator: the pill follows the tab you pick", async ({ page }, testInfo) => {
		const stage = await take(page, /^Tab indicator:/);
		const tab = stage.getByRole("tab", { name: "Security" });
		await tab.click();
		await expect(stage).toHaveAttribute("data-taken", "true");
		await expect(tab).toHaveAttribute("aria-selected", "true");
		await expect(stage.getByText("3 devices signed in")).toBeVisible();
		await expect
			.poll(async () => {
				const [pill, t] = await Promise.all([
					stage.locator(".ti__pill").boundingBox(),
					tab.boundingBox(),
				]);
				return (
					!!pill && !!t && Math.abs(pill.x - t.x) < 1.5 && Math.abs(pill.width - t.width) < 1.5
				);
			})
			.toBe(true);
		await quiet(page, /^$/);
		await settle(page);
		await expectNoViolations(await makeAxe(page).analyze(), testInfo, "tabs taken");
	});

	test("Stacked toasts: show adds one, dismiss removes it", async ({ page }, testInfo) => {
		const stage = await take(page, /^Stacked toasts:/);
		const items = stage.locator(".ts__item");
		await stage.getByRole("button", { name: "Show toast" }).click();
		await expect(stage).toHaveAttribute("data-taken", "true");
		const before = await items.count();
		expect(before).toBeGreaterThan(0);
		await stage.getByRole("button", { name: "Show toast" }).click();
		await expect(items).toHaveCount(Math.min(3, before + 1));
		await quiet(page, /^$/);
		await settle(page);
		await expectNoViolations(await makeAxe(page).analyze(), testInfo, "toasts taken");
		const n = await items.count();
		await stage
			.getByRole("button", { name: /^Dismiss / })
			.first()
			.click();
		await expect(items).toHaveCount(n - 1);
	});

	test("Sheet spring: Choose seats opens it, Escape closes it", async ({ page }, testInfo) => {
		const stage = await take(page, /^Sheet spring:/);
		const sheet = stage.locator(".sh__sheet");
		await stage.getByRole("button", { name: "Choose seats" }).click();
		await expect(stage).toHaveAttribute("data-taken", "true");
		await expect(sheet).toHaveJSProperty("inert", false);
		await expect
			.poll(() => sheet.evaluate((n) => new DOMMatrix(getComputedStyle(n).transform).m42))
			.toBeLessThan(1);
		await quiet(page, /^$/);
		await settle(page);
		await expectNoViolations(await makeAxe(page).analyze(), testInfo, "sheet taken");
		await stage.getByRole("button", { name: "Done" }).focus();
		await page.keyboard.press("Escape");
		await expect(sheet).toHaveJSProperty("inert", true);
	});

	test("Sheet spring: dragging the handle down dismisses it", async ({ page }) => {
		const stage = await take(page, /^Sheet spring:/);
		const sheet = stage.locator(".sh__sheet");
		await stage.getByRole("button", { name: "Choose seats" }).click();
		await expect(sheet).toHaveJSProperty("inert", false);
		await expect
			.poll(() => sheet.evaluate((n) => new DOMMatrix(getComputedStyle(n).transform).m42))
			.toBeLessThan(1);
		const grab = await stage.locator(".sh__grab").boundingBox();
		if (!grab) throw new Error("no grab box");
		const x = grab.x + grab.width / 2;
		const y = grab.y + 10;
		await page.mouse.move(x, y);
		await page.mouse.down();
		await page.mouse.move(x, y + 140, { steps: 10 });
		await page.mouse.up();
		await expect(sheet).toHaveJSProperty("inert", true);
	});

	test("Filter list: choosing a chip filters the rows", async ({ page }, testInfo) => {
		const stage = await take(page, /^Filter list:/);
		await stage.getByRole("button", { name: "Ops" }).click();
		await expect(stage).toHaveAttribute("data-taken", "true");
		await expect(stage.locator(".fi__row")).toHaveCount(2);
		await expect(stage.getByText("2 projects")).toBeVisible();
		await quiet(page, /^$/);
		await settle(page);
		await expectNoViolations(await makeAxe(page).analyze(), testInfo, "filter taken");
		await stage.getByRole("button", { name: "All" }).click();
		await expect(stage.locator(".fi__row")).toHaveCount(6);
	});
});

test.describe("motion transitions: reduced motion", () => {
	// The project default is reducedMotion: "reduce".
	async function reduced(page: Page, label: RegExp) {
		await gotoReady(page, PAGE);
		const stage = page.getByRole("group", { name: label });
		await stage.scrollIntoViewIfNeeded();
		await expect(stage).toHaveAttribute("data-reduced", "true");
		await expect(stage).toHaveAttribute("data-playing", "false");
		return stage;
	}

	test("Shared element shows the detail", async ({ page }, testInfo) => {
		const stage = await reduced(page, /^Shared element:/);
		await expect(stage.getByText("12 seats, audit log, SSO")).toBeVisible();
		await expect(stage.locator(".se__view")).toHaveCSS("animation-name", "none");
		await quiet(page, /^$/);
		await settle(page);
		await expectNoViolations(await makeAxe(page).analyze(), testInfo, "shared reduced");
	});

	test("FLIP reorder shows the final order", async ({ page }, testInfo) => {
		const stage = await reduced(page, /^FLIP reorder:/);
		await expect(stage.locator(".fl__row").first()).toContainText("Initech");
		await quiet(page, /^$/);
		await settle(page);
		await expectNoViolations(await makeAxe(page).analyze(), testInfo, "flip reduced");
	});

	test("Height spring shows an open panel at full height", async ({ page }, testInfo) => {
		const stage = await reduced(page, /^Height spring:/);
		const panel = stage.getByRole("region", { name: "When am I billed?" });
		await expect
			.poll(async () => {
				const [clip, body] = await Promise.all([
					panel.evaluate((n) => n.getBoundingClientRect().height),
					panel.locator(".hs__body").evaluate((n) => n.scrollHeight),
				]);
				return clip > 10 && Math.abs(clip - body) < 1.5;
			})
			.toBe(true);
		await quiet(page, /^$/);
		await settle(page);
		await expectNoViolations(await makeAxe(page).analyze(), testInfo, "height reduced");
	});

	test("Tab indicator sits under the final tab without a transition", async ({
		page,
	}, testInfo) => {
		const stage = await reduced(page, /^Tab indicator:/);
		await expect(stage.getByRole("tab", { name: "Billing" })).toHaveAttribute(
			"aria-selected",
			"true"
		);
		await expect(stage.locator(".ti__pill")).toHaveCSS("transition-property", "none");
		await quiet(page, /^$/);
		await settle(page);
		await expectNoViolations(await makeAxe(page).analyze(), testInfo, "tabs reduced");
	});

	test("Stacked toasts shows the full stack", async ({ page }, testInfo) => {
		const stage = await reduced(page, /^Stacked toasts:/);
		await expect(stage.locator(".ts__item")).toHaveCount(3);
		await expect(stage.locator(".ts__item").first()).toHaveCSS("animation-name", "none");
		await quiet(page, /^$/);
		await settle(page);
		await expectNoViolations(await makeAxe(page).analyze(), testInfo, "toasts reduced");
	});

	test("Sheet spring is open", async ({ page }, testInfo) => {
		const stage = await reduced(page, /^Sheet spring:/);
		await expect(stage.locator(".sh__sheet")).toHaveJSProperty("inert", false);
		await expect
			.poll(() =>
				stage
					.locator(".sh__sheet")
					.evaluate((n) => new DOMMatrix(getComputedStyle(n).transform).m42)
			)
			.toBeLessThan(1);
		await quiet(page, /^$/);
		await settle(page);
		await expectNoViolations(await makeAxe(page).analyze(), testInfo, "sheet reduced");
	});

	test("Filter list shows the Dev rows", async ({ page }, testInfo) => {
		const stage = await reduced(page, /^Filter list:/);
		await expect(stage.locator(".fi__row")).toHaveCount(2);
		await expect(stage.getByRole("button", { name: "Dev" })).toBeVisible();
		await quiet(page, /^$/);
		await settle(page);
		await expectNoViolations(await makeAxe(page).analyze(), testInfo, "filter reduced");
	});
});
