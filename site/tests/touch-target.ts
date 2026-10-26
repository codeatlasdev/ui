import type { Page } from "@playwright/test";

/**
 * The minimum hit area in px of the page under test: `--ca-touch-target`, resolved by the browser. Specs compare
 * with this, never with a literal 44 (#650).
 */
export const touchTarget = (page: Page): Promise<number> =>
	page.evaluate(() => {
		const probe = document.createElement("div");
		probe.style.cssText = "position:absolute;visibility:hidden;width:var(--ca-touch-target)";
		document.body.append(probe);
		const px = probe.getBoundingClientRect().width;
		probe.remove();
		if (!(px > 0)) throw new Error("--ca-touch-target did not resolve on this page");
		return px;
	});
