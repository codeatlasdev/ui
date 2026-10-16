import type { Locator, Page } from "@playwright/test";
import { expect, expectNoViolations, gotoReady, makeAxe, test } from "./fixtures";

const PAGE = "/docs/motion/scroll/";

// Each demo: the stage name, the scroll container's region name, and one observable effect of scroll
// (`probe` reads a number that must grow with scrollTop, `final` the value expected under reduced motion).
const DEMOS = [
	{
		id: "320",
		stage: /^Staggered reveal on scroll:/,
		region: "Activity feed",
		probe: (r: Locator) => r.locator(".feed__row--in").count(),
		final: (r: Locator) => expect(r.locator(".feed__row--in")).toHaveCount(6),
	},
	{
		id: "321",
		stage: /^View timeline reveal:/,
		region: "Store metrics",
		probe: (r: Locator) =>
			r
				.locator(".vt__tile")
				.last()
				.evaluate((el) => Number(getComputedStyle(el).opacity)),
		final: (r: Locator) => expect(r.locator(".vt__tile").last()).toHaveCSS("opacity", "1"),
	},
	{
		id: "322",
		stage: /^Parallax layers:/,
		region: "Alpine route preview",
		probe: (r: Locator) =>
			r
				.locator(".layer--near")
				.evaluate((el) => Math.abs(new DOMMatrixReadOnly(getComputedStyle(el).transform).f)),
		final: (r: Locator) => expect(r).toHaveClass(/scene--final/),
	},
	{
		id: "323",
		stage: /^Reading progress bar:/,
		region: "Article: How we cut checkout time in half",
		probe: (r: Locator) =>
			r
				.locator(".doc__fill")
				.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).a),
		final: (r: Locator) => expect(r.locator(".doc__pct")).toHaveText("100%"),
	},
	{
		id: "324",
		stage: /^Horizontal scroll section:/,
		region: "Expense flow, four steps",
		probe: (r: Locator) =>
			r
				.locator(".hs__rail")
				.evaluate((el) => Math.abs(new DOMMatrixReadOnly(getComputedStyle(el).transform).e)),
		final: (r: Locator) => expect(r).toHaveClass(/hs--final/),
	},
	{
		id: "325",
		stage: /^Pinned step story:/,
		region: "How it works, three steps",
		probe: (r: Locator) =>
			r.locator(".story__step--on").evaluate((el) => Number((el as HTMLElement).dataset.step)),
		final: (r: Locator) => expect(r.locator(".story__step--on")).toHaveAttribute("data-step", "2"),
	},
	{
		id: "326",
		stage: /^Scroll-linked counter and chart:/,
		region: "Revenue summary",
		probe: (r: Locator) =>
			r
				.locator(".rev__value [aria-hidden]")
				.innerText()
				.then((t) => Number(t.replace(/\D/g, ""))),
		final: (r: Locator) => expect(r.locator(".rev__value [aria-hidden]")).toHaveText("$48,210"),
	},
];

// fixtures.settle() awaits every finite animation, but a scroll-driven animation only finishes when its
// container reaches the end, so it would hang while a demo is mid-scroll. Wait for fonts instead.
const ready = (page: Page) => page.evaluate(() => document.fonts.ready.then(() => undefined));

const region = (page: Page, d: (typeof DEMOS)[number]) =>
	page.getByRole("group", { name: d.stage }).getByRole("region", { name: d.region });

test.describe("scroll motion demos", () => {
	test.describe("motion allowed", () => {
		test.use({ reducedMotion: "no-preference" });

		for (const d of DEMOS) {
			test(`#${d.id} ${d.region}: plays in view by scrolling its own container, and a user scroll takes over`, async ({
				page,
			}, testInfo) => {
				await gotoReady(page, PAGE);
				const stage = page.getByRole("group", { name: d.stage });
				const r = region(page, d);
				await stage.scrollIntoViewIfNeeded();
				await expect(stage).toHaveAttribute("data-playing", "true");
				// Autoplay moves the container itself, not the page.
				await expect
					.poll(() => r.evaluate((el) => el.scrollTop), { timeout: 4000 })
					.toBeGreaterThan(20);
				await ready(page);
				await expectNoViolations(await makeAxe(page).analyze(), testInfo, "playing");

				// Takeover: wheel over the container hands control to the user.
				await r.hover();
				await page.mouse.wheel(0, -4000);
				await expect(stage).toHaveAttribute("data-taken", "true");
				// Within 4px of the top: touch devices keep a sub-pixel residue after a smooth wheel scroll.
				await expect.poll(() => r.evaluate((el) => el.scrollTop)).toBeLessThan(4);
				const atTop = await d.probe(r);
				await r.evaluate((el) => el.scrollTo({ top: el.scrollHeight }));
				// The effect responds to the user's scroll (observable value changes with scrollTop).
				await expect.poll(() => d.probe(r)).not.toBe(atTop);
				await expectNoViolations(await makeAxe(page).analyze(), testInfo, "taken over");
			});
		}
	});

	for (const d of DEMOS) {
		test(`#${d.id} ${d.region}: reduced motion shows the final state and does not scroll`, async ({
			page,
		}, testInfo) => {
			await gotoReady(page, PAGE);
			const stage = page.getByRole("group", { name: d.stage });
			await stage.scrollIntoViewIfNeeded();
			await expect(stage).toHaveAttribute("data-reduced", "true");
			await expect(stage).toHaveAttribute("data-playing", "false");
			await d.final(region(page, d));
			expect(await region(page, d).evaluate((el) => el.scrollTop)).toBe(0);
			await ready(page);
			await expectNoViolations(await makeAxe(page).analyze(), testInfo, "reduced");
		});
	}
});
