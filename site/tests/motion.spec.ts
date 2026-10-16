import { expect, expectNoViolations, gotoReady, makeAxe, settle, test } from "./fixtures";

const PAGE = "/docs/motion/basics/";

// The suite default is `reducedMotion: "reduce"`; the autoplay contract needs the opposite.
test.describe("MotionStage", () => {
	test.describe("motion allowed", () => {
		test.use({ reducedMotion: "no-preference" });

		test("plays in view, pause stops it, taking over stops it and offers Replay", async ({
			page,
		}, testInfo) => {
			await gotoReady(page, PAGE);
			const stage = page.getByRole("group", { name: /^Fade rise:/ });
			await stage.scrollIntoViewIfNeeded();
			await expect(stage).toHaveAttribute("data-playing", "true");
			const cycle = () => stage.getAttribute("data-cycle").then(Number);
			const first = await cycle();
			await expect.poll(cycle, { timeout: 8_000 }).toBeGreaterThan(first);
			await settle(page);
			await expectNoViolations(await makeAxe(page).analyze(), testInfo, "playing");

			const pause = stage.getByRole("button", { name: "Pause" });
			await expect(pause).toHaveAttribute("aria-pressed", "false");
			await pause.click();
			await expect(pause).toHaveAttribute("aria-pressed", "true");
			await expect(stage).toHaveAttribute("data-playing", "false");
			const stopped = await cycle();
			await page.waitForTimeout(2_800);
			expect(await cycle()).toBe(stopped);
			await expectNoViolations(await makeAxe(page).analyze(), testInfo, "paused");

			await pause.click();
			await expect(stage).toHaveAttribute("data-playing", "true");
			await expect(stage).toHaveAttribute("data-taken", "false");
			await expect(stage.getByRole("button", { name: "Replay" })).toHaveCount(0);

			// Pointer on the demo itself is a takeover.
			await stage.locator(".motion-stage__canvas").click();
			await expect(stage).toHaveAttribute("data-taken", "true");
			await expect(stage).toHaveAttribute("data-playing", "false");
			const replay = stage.getByRole("button", { name: "Replay" });
			await expect(replay).toBeVisible();
			const taken = await cycle();
			await page.waitForTimeout(2_800);
			expect(await cycle()).toBe(taken);
			await expectNoViolations(await makeAxe(page).analyze(), testInfo, "taken over");

			await replay.click();
			await expect(stage).toHaveAttribute("data-taken", "false");
			await expect(stage).toHaveAttribute("data-playing", "true");
			expect(await cycle()).toBeGreaterThan(taken);
			await expect(replay).toHaveCount(0);
		});

		test("stops when it leaves the viewport and when the tab is hidden", async ({ page }) => {
			await gotoReady(page, PAGE);
			const stage = page.getByRole("group", { name: /^Fade rise:/ });
			await stage.scrollIntoViewIfNeeded();
			await expect(stage).toHaveAttribute("data-playing", "true");

			// Push the stage out of the viewport without scrolling (the page is shorter than a screen).
			await stage.evaluate((el) => {
				el.style.transform = "translateY(-3000px)";
			});
			await expect(stage).not.toBeInViewport();
			await expect(stage).toHaveAttribute("data-playing", "false");
			await stage.evaluate((el) => {
				el.style.transform = "";
			});
			await expect(stage).toHaveAttribute("data-playing", "true");

			await page.evaluate(() => {
				Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
				document.dispatchEvent(new Event("visibilitychange"));
			});
			await expect(stage).toHaveAttribute("data-playing", "false");
		});

		test("keyboard focus on the demo is a takeover", async ({ page }) => {
			await gotoReady(page, PAGE);
			const stage = page.getByRole("group", { name: /^Fade rise:/ });
			await stage.scrollIntoViewIfNeeded();
			await expect(stage).toHaveAttribute("data-playing", "true");
			await stage.locator(".motion-stage__canvas").evaluate((el) => {
				const b = document.createElement("button");
				b.textContent = "probe";
				el.append(b);
				b.focus();
			});
			await expect(stage).toHaveAttribute("data-taken", "true");
		});
	});

	test.describe("reduced motion", () => {
		test.use({ reducedMotion: "reduce" });

		test("renders the final state, never plays, no controls to start motion", async ({
			page,
		}, testInfo) => {
			await gotoReady(page, PAGE);
			const stage = page.getByRole("group", { name: /^Fade rise:/ });
			await stage.scrollIntoViewIfNeeded();
			await expect(stage).toHaveAttribute("data-reduced", "true");
			await expect(stage).toHaveAttribute("data-playing", "false");
			const card = stage.locator(".rise");
			await expect(card).toHaveCSS("animation-name", "none");
			await expect(card).toHaveCSS("opacity", "1");
			const before = await stage.getAttribute("data-cycle");
			await page.waitForTimeout(2_800);
			expect(await stage.getAttribute("data-cycle")).toBe(before);
			await expect(stage.getByRole("button", { name: "Pause" })).toHaveCount(0);
			await settle(page);
			await expectNoViolations(await makeAxe(page).analyze(), testInfo, "reduced");
		});
	});
});
