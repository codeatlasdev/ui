import { expect, expectNoViolations, gotoReady, makeAxe, settle, test } from "./fixtures";

// The stage's own behavior (in view, pause, takeover, reduced) is tested in packages/ui next to the
// component. This spec proves the docs page wires it: the reference demo plays, takes over and is
// accessible in the built site.
const PAGE = "/docs/motion/basics/";

test.describe("motion docs page", () => {
	test.describe("motion allowed", () => {
		test.use({ reducedMotion: "no-preference" });

		test("the Fade rise demo plays in view, and a touch takes over", async ({ page }, testInfo) => {
			await gotoReady(page, PAGE);
			const stage = page.getByRole("group", { name: /^Fade rise:/ });
			await stage.scrollIntoViewIfNeeded();
			await expect(stage).toHaveAttribute("data-playing", "true");
			await settle(page);
			await expectNoViolations(await makeAxe(page).analyze(), testInfo, "playing");

			await stage.locator(".ca-motion-stage__canvas").click();
			await expect(stage).toHaveAttribute("data-taken", "true");
			await expect(stage.getByRole("button", { name: "Replay" })).toBeVisible();
			await expectNoViolations(await makeAxe(page).analyze(), testInfo, "taken over");
		});
	});

	test("under reduced motion the demo shows its final state", async ({ page }, testInfo) => {
		await gotoReady(page, PAGE);
		const stage = page.getByRole("group", { name: /^Fade rise:/ });
		await stage.scrollIntoViewIfNeeded();
		await expect(stage).toHaveAttribute("data-reduced", "true");
		await expect(stage).toHaveAttribute("data-playing", "false");
		await expect(stage.locator(".rise")).toHaveCSS("animation-name", "none");
		await expect(stage.locator(".rise")).toHaveCSS("opacity", "1");
		await settle(page);
		await expectNoViolations(await makeAxe(page).analyze(), testInfo, "reduced");
	});
});
