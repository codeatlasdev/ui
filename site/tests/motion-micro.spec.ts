import type { Page } from "@playwright/test";
import { expect, expectNoViolations, gotoReady, makeAxe, settle, test } from "./fixtures";

const PAGE = "/docs/motion/micro-interactions/";

async function prepare(page: Page, name: RegExp) {
	await gotoReady(page, PAGE);
	const stage = page.getByRole("group", { name });
	await stage.scrollIntoViewIfNeeded();
	// Islands are client:visible: wait until the demo has hydrated before touching it.
	await expect(stage.locator("button, .tilt__card").first()).toBeVisible();
	return stage;
}

async function noViolations(
	page: Page,
	testInfo: Parameters<typeof expectNoViolations>[1],
	label: string
) {
	await settle(page);
	await expectNoViolations(await makeAxe(page).analyze(), testInfo, label);
}

test.describe("motion micro-interactions", () => {
	test.describe("motion allowed", () => {
		test.use({ reducedMotion: "no-preference" });

		test("magnetic button: plays in view, the real pointer pulls it", async ({
			page,
		}, testInfo) => {
			const stage = await prepare(page, /^Magnetic button:/);
			await expect(stage).toHaveAttribute("data-playing", "true");
			await noViolations(page, testInfo, "magnetic playing");
			const btn = stage.locator(".mag__btn");
			// Stop the autoplay and let the spring come to rest, so the baseline box is the resting one.
			await stage.getByRole("button", { name: "Pause" }).click();
			await expect
				.poll(() => btn.evaluate((el) => getComputedStyle(el).transform))
				.toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
			const box = (await btn.boundingBox())!;
			await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2);
			await expect(stage).toHaveAttribute("data-taken", "true");
			if (await page.evaluate(() => matchMedia("(pointer: coarse)").matches)) {
				// Touch: the pull is disabled by design, the button stays put.
				await expect(btn).toHaveCSS("transform", "none");
				return;
			}
			await expect.poll(async () => (await btn.boundingBox())!.x).toBeGreaterThan(box.x + 4);
			await page.mouse.move(box.x - 400, box.y - 200);
			await expect.poll(async () => Math.abs((await btn.boundingBox())!.x - box.x)).toBeLessThan(2);
		});

		test("press spring: pointer press scales it down and counts", async ({ page }, testInfo) => {
			const stage = await prepare(page, /^Press spring:/);
			await expect(stage).toHaveAttribute("data-playing", "true");
			await noViolations(page, testInfo, "press playing");
			const btn = stage.getByRole("button", { name: "Pay $48.00" });
			await stage.getByRole("button", { name: "Pause" }).click();
			await expect
				.poll(() => btn.evaluate((el) => Number(el.style.getPropertyValue("--s"))))
				.toBeGreaterThan(0.999);
			const box = (await btn.boundingBox())!;
			await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
			await page.mouse.down();
			await expect(stage).toHaveAttribute("data-taken", "true");
			await expect
				.poll(() => btn.evaluate((el) => Number(el.style.getPropertyValue("--s"))))
				.toBeLessThan(0.97);
			await page.mouse.up();
			await expect(stage.getByText(/^Pressed 1 time$/)).toBeVisible();
		});

		test("morphing toggle: click flips aria-checked", async ({ page }, testInfo) => {
			const stage = await prepare(page, /^Morphing toggle:/);
			await expect(stage).toHaveAttribute("data-playing", "true");
			await noViolations(page, testInfo, "morph playing");
			const sw = stage.getByRole("switch", { name: "Dark mode" });
			await sw.click();
			await expect(stage).toHaveAttribute("data-taken", "true");
			const first = await sw.getAttribute("aria-checked");
			await sw.click();
			await expect(sw).not.toHaveAttribute("aria-checked", first!);
			await noViolations(page, testInfo, "morph taken over");
		});

		test("spring switch: click flips aria-checked", async ({ page }, testInfo) => {
			const stage = await prepare(page, /^Spring switch:/);
			await expect(stage).toHaveAttribute("data-playing", "true");
			await noViolations(page, testInfo, "switch playing");
			const sw = stage.getByRole("switch", { name: "Push notifications" });
			await sw.click();
			await expect(stage).toHaveAttribute("data-taken", "true");
			const first = await sw.getAttribute("aria-checked");
			await sw.click();
			await expect(sw).not.toHaveAttribute("aria-checked", first!);
		});

		test("like burst: click presses it and the count follows", async ({ page }, testInfo) => {
			const stage = await prepare(page, /^Like burst:/);
			await expect(stage).toHaveAttribute("data-playing", "true");
			await noViolations(page, testInfo, "like playing");
			const btn = stage.getByRole("button", { name: /^Like/ });
			await btn.click();
			await expect(stage).toHaveAttribute("data-taken", "true");
			const pressed = await btn.getAttribute("aria-pressed");
			await btn.click();
			await expect(btn).not.toHaveAttribute("aria-pressed", pressed!);
			await noViolations(page, testInfo, "like taken over");
		});

		test("hold to confirm: a short hold cancels, a full keyboard hold confirms", async ({
			page,
		}, testInfo) => {
			const stage = await prepare(page, /^Hold to confirm:/);
			await expect(stage).toHaveAttribute("data-playing", "true");
			await noViolations(page, testInfo, "hold playing");
			const btn = stage.locator(".hold__btn");
			await btn.focus();
			await expect(stage).toHaveAttribute("data-taken", "true");
			// Cancel on early release: the ring drains and nothing is deleted.
			await page.keyboard.down("Space");
			await page.waitForTimeout(250);
			await page.keyboard.up("Space");
			await expect(stage.getByText("Project deleted")).toHaveCount(0);
			await expect(stage.locator(".hold__bar")).toHaveAttribute("stroke-dashoffset", /^1[0-9.]+$/);
			// A full hold confirms.
			await page.keyboard.down("Enter");
			await expect(stage.getByText("Project deleted")).toBeVisible({ timeout: 4000 });
			await page.keyboard.up("Enter");
			await noViolations(page, testInfo, "hold confirmed");
		});

		test("copy to check: click morphs the icon to a check", async ({ page }, testInfo) => {
			const stage = await prepare(page, /^Copy to check:/);
			await expect(stage).toHaveAttribute("data-playing", "true");
			await noViolations(page, testInfo, "copy playing");
			const btn = stage.locator(".cc__btn");
			await stage.locator(".ca-motion-stage__canvas").click({ position: { x: 4, y: 4 } });
			await expect(stage).toHaveAttribute("data-taken", "true");
			await expect(btn).not.toHaveClass(/cc__btn--done/);
			await btn.click();
			await expect(btn).toHaveClass(/cc__btn--done/);
			await expect(btn).toContainText("Copied");
			await expect(btn).not.toHaveClass(/cc__btn--done/, { timeout: 3000 });
		});

		test("add to cart fly: Add bumps the cart count", async ({ page }, testInfo) => {
			const stage = await prepare(page, /^Add to cart:/);
			await expect(stage).toHaveAttribute("data-playing", "true");
			await noViolations(page, testInfo, "cart playing");
			const add = stage.getByRole("button", { name: "Add to cart" });
			await add.click();
			await expect(stage).toHaveAttribute("data-taken", "true");
			const bag = stage.getByRole("img", { name: /^Cart, \d+ items$/ });
			const before = Number((await bag.getAttribute("aria-label"))!.match(/\d+/)![0]);
			await add.click();
			await expect(bag).toHaveAttribute("aria-label", `Cart, ${before + 1} items`, {
				timeout: 3000,
			});
			await noViolations(page, testInfo, "cart taken over");
		});

		test("tilt card: the real pointer tilts it", async ({ page }, testInfo) => {
			const stage = await prepare(page, /^Tilt card:/);
			await expect(stage).toHaveAttribute("data-playing", "true");
			await noViolations(page, testInfo, "tilt playing");
			const card = stage.locator(".tilt__card");
			const box = (await card.boundingBox())!;
			await page.mouse.move(box.x + box.width * 0.95, box.y + box.height * 0.1);
			await expect(stage).toHaveAttribute("data-taken", "true");
			if (await page.evaluate(() => matchMedia("(pointer: coarse)").matches)) {
				// Touch: the tilt is disabled by design, the card stays flat.
				await expect(card).toHaveCSS("transform", "none");
				return;
			}
			await expect
				.poll(() => card.evaluate((el) => getComputedStyle(el).transform))
				.toMatch(/^matrix3d/);
		});
	});

	test.describe("reduced motion renders the final state", () => {
		test("every demo is still and accessible", async ({ page }, testInfo) => {
			await gotoReady(page, PAGE);
			const names = [
				/^Magnetic button:/,
				/^Press spring:/,
				/^Morphing toggle:/,
				/^Like burst:/,
				/^Hold to confirm:/,
				/^Copy to check:/,
				/^Add to cart:/,
				/^Tilt card:/,
				/^Spring switch:/,
			];
			for (const name of names) {
				const stage = page.getByRole("group", { name });
				await stage.scrollIntoViewIfNeeded();
				await expect(stage).toHaveAttribute("data-reduced", "true");
				await expect(stage).toHaveAttribute("data-playing", "false");
			}
			// Final state: nothing is pulled, tilted or pressed, and no particles or flying dots exist.
			await expect(page.locator(".mag__btn")).toHaveCSS(
				"transform",
				/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/
			);
			await expect(page.locator(".tilt__card")).toHaveCSS(
				"transform",
				/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/
			);
			await expect(page.locator(".like__ring")).toHaveCount(0);
			await expect(page.locator(".cart__dot")).toHaveCount(0);
			await noViolations(page, testInfo, "reduced");
		});
	});
});
