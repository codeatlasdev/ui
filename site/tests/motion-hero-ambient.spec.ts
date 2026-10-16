import { expect, expectNoViolations, gotoReady, makeAxe, settle, test } from "./fixtures";

// One block per demo of /docs/motion/hero-ambient/: plays in view, a user gesture takes over and
// visibly drives the effect, reduced motion shows the final state, axe is clean in both modes.
const PAGE = "/docs/motion/hero-ambient/";
const boxOf = async (loc: import("@playwright/test").Locator) => {
	const b = await loc.boundingBox();
	if (!b) throw new Error("element has no box");
	return b;
};
const stageOf = (page: import("@playwright/test").Page, label: string) =>
	page.getByRole("group", { name: new RegExp(`^${label}:`) });

const DEMOS = [
	{ label: "Cursor spotlight", probe: ".spot" },
	{ label: "Grid ripple", probe: ".rip" },
	{ label: "Animated gradient field", probe: ".field" },
	{ label: "Before and after compare", probe: ".cmp" },
	{ label: "Cursor trail", probe: ".trail" },
	{ label: "Hero intro", probe: ".intro" },
	{ label: "Card tilt with glare", probe: ".tilt" },
] as const;

test.describe("hero and ambient motion", () => {
	test.describe("motion allowed", () => {
		test.use({ reducedMotion: "no-preference" });

		for (const { label, probe } of DEMOS) {
			test(`${label} plays in view and is axe clean`, async ({ page }, testInfo) => {
				await gotoReady(page, PAGE);
				const stage = stageOf(page, label);
				await stage.scrollIntoViewIfNeeded();
				await expect(stage).toHaveAttribute("data-playing", "true");
				await expect(stage.locator(probe)).toBeVisible();
				await settle(page);
				await expectNoViolations(await makeAxe(page).analyze(), testInfo, label);
			});
		}

		test("Cursor spotlight: the pointer moves the light", async ({ page }) => {
			await gotoReady(page, PAGE);
			const stage = stageOf(page, "Cursor spotlight");
			await stage.scrollIntoViewIfNeeded();
			const spot = stage.locator(".spot");
			const box = await boxOf(spot);
			await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.8);
			await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.8, { steps: 2 });
			await expect(stage).toHaveAttribute("data-taken", "false");
			await page.mouse.down();
			await page.mouse.up();
			await expect(stage).toHaveAttribute("data-taken", "true");
			await expect(spot).toHaveAttribute("style", /--x: (8[5-9]|9\d)(\.\d+)?%/);
			await page.mouse.move(box.x + box.width * 0.1, box.y + box.height * 0.2);
			await expect(spot).toHaveAttribute("style", /--x: (\d|1\d)(\.\d+)?%/);
		});

		test("Grid ripple: a click restarts the wave from the clicked dot", async ({ page }) => {
			await gotoReady(page, PAGE);
			const stage = stageOf(page, "Grid ripple");
			await stage.scrollIntoViewIfNeeded();
			const first = await boxOf(stage.locator(".rip__dot").first());
			// Top-left cell: its own delay is 0ms, the far corner waits the longest.
			await page.mouse.click(first.x + first.width / 2, first.y + first.height / 2);
			await expect(stage).toHaveAttribute("data-taken", "true");
			const delays = await stage
				.locator(".rip__dot")
				.evaluateAll((els) => els.map((e) => (e as HTMLElement).style.getPropertyValue("--d")));
			expect(delays[0]).toBe("0ms");
			expect(Number.parseInt(delays.at(-1) ?? "0", 10)).toBeGreaterThan(700);
		});

		test("Gradient field: moving the pointer paints hue and angle", async ({ page }) => {
			await gotoReady(page, PAGE);
			const stage = stageOf(page, "Animated gradient field");
			await stage.scrollIntoViewIfNeeded();
			const field = stage.locator(".field");
			await expect(field).toHaveCSS("animation-name", /field-drift$/);
			const box = await boxOf(field);
			await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
			await page.mouse.down();
			await page.mouse.up();
			await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5 + 4);
			await expect(field).toHaveAttribute("style", /--hue: 45; --angle: \d+deg/);
			await expect(field).toHaveCSS("animation-name", "none");
		});

		test("Compare slider: arrows move the divider, the spring snaps a drag", async ({ page }) => {
			await gotoReady(page, PAGE);
			const stage = stageOf(page, "Before and after compare");
			await stage.scrollIntoViewIfNeeded();
			const handle = stage.getByRole("slider", { name: "Compare before and after" });
			await handle.focus();
			await expect(stage).toHaveAttribute("data-taken", "true");
			await page.keyboard.press("Home");
			await expect(handle).toHaveAttribute("aria-valuenow", "0");
			await page.keyboard.press("ArrowRight");
			await expect(handle).toHaveAttribute("aria-valuenow", "10");
			await page.keyboard.press("Shift+ArrowRight");
			await expect(handle).toHaveAttribute("aria-valuenow", "35");
			await page.keyboard.press("End");
			await expect(handle).toHaveAttribute("aria-valuenow", "100");
			// Drag to ~70%: on release the divider snaps to the nearest stop, 75.
			const cmp = stage.locator(".cmp");
			const box = await boxOf(cmp);
			await page.mouse.move(box.x + box.width * 0.9, box.y + box.height / 2);
			await page.mouse.down();
			await page.mouse.move(box.x + box.width * 0.7, box.y + box.height / 2, { steps: 4 });
			await page.mouse.up();
			await expect(handle).toHaveAttribute("aria-valuenow", "75");
		});

		test("Cursor trail: dots appear and follow the pointer", async ({ page }) => {
			await gotoReady(page, PAGE);
			const stage = stageOf(page, "Cursor trail");
			await stage.scrollIntoViewIfNeeded();
			const trail = stage.locator(".trail");
			await expect(stage.locator(".trail__dot")).toHaveCount(14);
			const box = await boxOf(trail);
			await page.mouse.move(box.x + 30, box.y + 30);
			await page.mouse.down();
			await page.mouse.up();
			await expect(stage).toHaveAttribute("data-taken", "true");
			await page.mouse.move(box.x + box.width - 30, box.y + box.height - 30, { steps: 8 });
			// The head dot settles on the pointer: translate close to the bottom-right corner.
			await expect
				.poll(async () =>
					stage
						.locator(".trail__dot")
						.first()
						.evaluate((e) => new DOMMatrix(getComputedStyle(e).transform).m41)
				)
				.toBeGreaterThan(box.width - 80);
		});

		test("Hero intro: the sequence replays on Replay and ends complete", async ({ page }) => {
			await gotoReady(page, PAGE);
			const stage = stageOf(page, "Hero intro");
			await stage.scrollIntoViewIfNeeded();
			await stage.locator(".intro__title").click();
			await expect(stage).toHaveAttribute("data-taken", "true");
			await stage.getByRole("button", { name: "Replay" }).click();
			const cta = stage.locator(".intro__cta");
			// Last child has the longest delay (3 x 90ms); after it everything is fully visible.
			await expect(cta).toHaveCSS("opacity", "1");
			await expect(stage.locator(".intro__title")).toHaveCSS("opacity", "1");
		});

		test("Card tilt: the pointer leans the card, never on a touch screen", async ({
			page,
			isMobile,
		}) => {
			await gotoReady(page, PAGE);
			const stage = stageOf(page, "Card tilt with glare");
			await stage.scrollIntoViewIfNeeded();
			const tilt = stage.locator(".tilt");
			const card = stage.locator(".tilt__card");
			const box = await boxOf(tilt);
			await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.5);
			await page.mouse.down();
			await page.mouse.up();
			await expect(stage).toHaveAttribute("data-taken", "true");
			await page.mouse.move(box.x + box.width * 0.95, box.y + box.height * 0.5, { steps: 3 });
			if (isMobile) {
				// Coarse pointer: the transform is removed and the rotation is forced to 0.
				await expect(card).toHaveCSS("transform", "none");
				await expect(card).toHaveAttribute("style", /--ry:\s*0deg/);
			} else {
				await expect
					.poll(async () => card.evaluate((e) => getComputedStyle(e).transform))
					.not.toBe("none");
				await expect(card).toHaveAttribute("style", /--ry: [1-9]/);
			}
		});
	});

	test.describe("reduced motion", () => {
		test("every demo renders its final state, nothing animates", async ({ page }, testInfo) => {
			await gotoReady(page, PAGE);
			for (const { label, probe } of DEMOS) {
				const stage = stageOf(page, label);
				await stage.scrollIntoViewIfNeeded();
				await expect(stage).toHaveAttribute("data-reduced", "true");
				await expect(stage).toHaveAttribute("data-playing", "false");
				await expect(stage.locator(probe)).toBeVisible();
			}
			await expect(stageOf(page, "Hero intro").locator(".intro__cta")).toHaveCSS(
				"animation-name",
				"none"
			);
			await expect(stageOf(page, "Hero intro").locator(".intro__title")).toHaveCSS("opacity", "1");
			await expect(stageOf(page, "Grid ripple").locator(".rip__dot").first()).toHaveCSS(
				"animation-name",
				"none"
			);
			await expect(stageOf(page, "Animated gradient field").locator(".field")).toHaveCSS(
				"animation-name",
				"none"
			);
			await expect(stageOf(page, "Cursor trail").locator(".trail__dot")).toHaveCount(0);
			await expect(stageOf(page, "Card tilt with glare").locator(".tilt__card")).toHaveAttribute(
				"style",
				/--rx:\s*0deg;\s*--ry:\s*0deg/
			);
			await expect(stageOf(page, "Before and after compare").getByRole("slider")).toHaveAttribute(
				"aria-valuenow",
				"50"
			);
			await settle(page);
			await expectNoViolations(await makeAxe(page).analyze(), testInfo, "reduced");
		});
	});
});
