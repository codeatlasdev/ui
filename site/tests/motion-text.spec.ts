import type { Locator, Page } from "@playwright/test";
import { expect, expectNoViolations, gotoReady, makeAxe, settle, test } from "./fixtures";

// Text motion demos (#254): each one plays in view, becomes interactive on takeover (an observable
// change from user input), shows its final state under reduced motion and passes axe.
const PAGE = "/docs/motion/text/";
const stage = (page: Page, label: RegExp) => page.getByRole("group", { name: label });

async function reveal(page: Page, label: RegExp): Promise<Locator> {
	const s = stage(page, label);
	await s.scrollIntoViewIfNeeded();
	return s;
}

const LABELS = {
	split: /^Split text reveal:/,
	blur: /^Blur in:/,
	scramble: /^Scramble:/,
	typewriter: /^Typewriter:/,
	odometer: /^Odometer:/,
	count: /^Count up:/,
	marquee: /^Marquee:/,
	shine: /^Shine sweep:/,
} as const;

test.describe("text motion: motion allowed", () => {
	test.use({ reducedMotion: "no-preference" });

	test("every demo plays in view and is axe clean", async ({ page }, testInfo) => {
		await gotoReady(page, PAGE);
		for (const [name, label] of Object.entries(LABELS)) {
			const s = await reveal(page, label);
			await expect(s, name).toHaveAttribute("data-playing", "true");
		}
		await settle(page);
		await expectNoViolations(await makeAxe(page).analyze(), testInfo, "playing");
	});

	test("split reveal: the words are hidden from AT and the heading keeps one name", async ({
		page,
	}) => {
		await gotoReady(page, PAGE);
		const s = await reveal(page, LABELS.split);
		const h = s.getByRole("heading", { name: "Close the books in one afternoon" });
		await expect(h).toBeVisible();
		await expect(h.locator(".split__word")).toHaveCount(6);
		await expect(h.locator(".split__mask").first()).toHaveAttribute("aria-hidden", "true");
		await expect(h.locator(".split__word").first()).toHaveCSS("animation-name", /split-rise$/);
		await s.getByRole("button", { name: "Reveal again" }).click();
		await expect(s).toHaveAttribute("data-taken", "true");
		await expect(h.locator(".split__word").first()).toHaveCSS("animation-name", /split-rise$/);
	});

	test("blur in: Sharpen again takes over and replays", async ({ page }) => {
		await gotoReady(page, PAGE);
		const s = await reveal(page, LABELS.blur);
		const line = s.locator(".bi__line").first();
		await expect(line).toHaveCSS("animation-name", /blur-in$/);
		await s.getByRole("button", { name: "Sharpen again" }).click();
		await expect(s).toHaveAttribute("data-taken", "true");
		await expect(s.getByRole("heading", { name: "Meet your new finance co-pilot" })).toBeVisible();
		await expect(line).toHaveCSS("animation-name", /blur-in$/);
	});

	test("scramble: hover re-scrambles, then settles on the real text", async ({ page }) => {
		await gotoReady(page, PAGE);
		const s = await reveal(page, LABELS.scramble);
		const text = s.locator(".scramble__text");
		const target = "ENCRYPTED  →  DECRYPTED";
		// Autoplay is still decoding or already settled; take over first so nothing races the assertions.
		const btn = s.getByRole("button", { name: target });
		await btn.focus(); // focusin is the takeover: autoplay stops, hover and focus now drive it
		await expect(s).toHaveAttribute("data-taken", "true");
		await expect(text).toHaveText(target, { timeout: 3000 });
		await page.mouse.move(0, 0);
		await btn.hover();
		// The glyphs scramble right after the pointer enters, then lock in on the real text.
		await expect(text).not.toHaveText(target, { timeout: 300 });
		await expect(text).toHaveText(target, { timeout: 3000 });
	});

	test("typewriter: typing in the field takes over the line", async ({ page }) => {
		await gotoReady(page, PAGE);
		const s = await reveal(page, LABELS.typewriter);
		const input = s.getByLabel("Assistant prompt");
		await input.click();
		await expect(s).toHaveAttribute("data-taken", "true");
		await input.fill("Summarize Q3");
		await expect(s.locator(".tw__text")).toHaveText("Summarize Q3");
		await expect(s.locator(".tw__caret")).toHaveCSS("animation-name", /tw-blink$/);
	});

	test("odometer: typing a number rolls the digit columns", async ({ page }) => {
		await gotoReady(page, PAGE);
		const s = await reveal(page, LABELS.odometer);
		const input = s.getByLabel("Type a number to roll it");
		await input.click();
		await expect(s).toHaveAttribute("data-taken", "true");
		await input.fill("90210");
		const value = s.getByRole("img", { name: "90,210 dollars" });
		await expect(value).toBeVisible();
		// The last column shows digit 0 and the first digit 9: translateY(-9em) on the first strip.
		const first = s.locator(".odo__strip").first();
		await expect(first).toHaveCSS("transition-property", "transform");
		await expect
			.poll(async () => first.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m42))
			.toBeLessThan(0);
	});

	test("count up: Count again re-runs the count and ends on the total", async ({ page }) => {
		await gotoReady(page, PAGE);
		const s = await reveal(page, LABELS.count);
		const total = s.getByRole("img", { name: "12,480 active customers" });
		await s.getByRole("button", { name: "Count again" }).click();
		await expect(s).toHaveAttribute("data-taken", "true");
		await expect(total.locator("span")).toHaveText("12,480", { timeout: 4000 });
	});

	test("marquee: hover pauses, the Forward button nudges after takeover", async ({ page }) => {
		await gotoReady(page, PAGE);
		const s = await reveal(page, LABELS.marquee);
		const track = s.locator(".mq__track");
		await expect(track).toHaveCSS("animation-name", /mq-slide$/);
		await s.locator(".mq__viewport").hover();
		await expect(track).toHaveCSS("animation-play-state", "paused");
		const link = s.getByRole("link", { name: "Northwind" }).first();
		await link.focus();
		await expect(s).toHaveAttribute("data-taken", "true");
		await s.getByRole("button", { name: "Back" }).click();
		await expect(track).toHaveAttribute("style", /--nudge:\s*56px/);
		await expect(s.locator("li[aria-hidden='true']")).toHaveCount(6);
	});

	test("shine sweep: the pointer steers the highlight", async ({ page }) => {
		await gotoReady(page, PAGE);
		const s = await reveal(page, LABELS.shine);
		await expect(
			s.getByRole("heading", { name: "Ship the quarter, not the spreadsheet" })
		).toBeVisible();
		const title = s.getByRole("button", { name: "Ship the quarter, not the spreadsheet" });
		await expect(title).toHaveCSS("animation-name", /shine-sweep$/);
		const box = (await title.boundingBox())!;
		await page.mouse.move(box.x + box.width * 0.9, box.y + box.height / 2);
		await page.mouse.down();
		await page.mouse.up();
		await expect(s).toHaveAttribute("data-taken", "true");
		await page.mouse.move(box.x + box.width * 0.1, box.y + box.height / 2);
		await expect(title).toHaveAttribute("style", /--x:\s*(\d|1\d)\.?\d*%/);
		await expect(title).toHaveCSS("animation-name", "none");
	});

	test("taken over, the page stays axe clean", async ({ page }, testInfo) => {
		await gotoReady(page, PAGE);
		for (const label of [LABELS.typewriter, LABELS.odometer, LABELS.marquee]) {
			const s = await reveal(page, label);
			await s.locator(".ca-motion-stage__canvas").click({ position: { x: 4, y: 4 } });
		}
		await settle(page);
		await expectNoViolations(await makeAxe(page).analyze(), testInfo, "taken over");
	});
});

test.describe("text motion: reduced motion", () => {
	test("every demo renders its final state, nothing plays", async ({ page }, testInfo) => {
		await gotoReady(page, PAGE);
		for (const label of Object.values(LABELS)) {
			const s = await reveal(page, label);
			await expect(s).toHaveAttribute("data-reduced", "true");
			await expect(s).toHaveAttribute("data-playing", "false");
		}
		const split = stage(page, LABELS.split);
		await expect(split.locator(".split__word").first()).toHaveCSS("animation-name", "none");
		await expect(split.locator(".split__word").first()).toHaveCSS("opacity", "1");
		await expect(stage(page, LABELS.blur).locator(".bi__line").first()).toHaveCSS(
			"animation-name",
			"none"
		);
		await expect(stage(page, LABELS.scramble).locator(".scramble__text")).toHaveText(
			"ENCRYPTED  →  DECRYPTED"
		);
		await expect(stage(page, LABELS.count).locator("[role=img] span")).toHaveText("12,480");
		await expect(
			stage(page, LABELS.odometer).getByRole("img", { name: "56,012 dollars" })
		).toBeVisible();
		await expect(stage(page, LABELS.odometer).locator(".odo__strip").first()).toHaveCSS(
			"transition-property",
			"all"
		);
		await expect(stage(page, LABELS.marquee).locator(".mq__track")).toHaveCSS(
			"animation-name",
			"none"
		);
		await expect(stage(page, LABELS.typewriter).locator(".tw__text")).toHaveText(
			"Invoice #4821 is paid."
		);
		await expect(stage(page, LABELS.typewriter).locator(".tw__caret")).toHaveCSS(
			"animation-name",
			"none"
		);
		await expect(stage(page, LABELS.shine).locator(".shine__title")).toHaveCSS(
			"animation-name",
			"none"
		);
		await settle(page);
		await expectNoViolations(await makeAxe(page).analyze(), testInfo, "reduced");
	});
});
