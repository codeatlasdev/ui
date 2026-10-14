import { expect, gotoReady, test } from "./fixtures";

// Production-bundle proof of the documented contract (theming.mdx "Cascade and overriding"):
// kit component CSS is in `@layer ca.components`, so an unlayered app rule with the SAME
// single-class selector wins, whatever order the bundler emitted the sheets in.
test.describe("app CSS beats component CSS in the built site", () => {
	test.skip(({ isMobile }) => isMobile, "desktop-only");

	test("single-class app rules override .ca-btn and .ca-tf__wrap", async ({ page }) => {
		await gotoReady(page, "/docs/inputs/button/");
		await page.addStyleTag({
			content:
				".ca-btn--filled { background-color: rgb(1, 2, 3); } .ca-tf__wrap { border-radius: 13px; }",
		});
		const btn = page.locator(".ca-btn--filled").first();
		await expect(btn).toHaveCSS("background-color", "rgb(1, 2, 3)");
		const wrapRadius = await page.evaluate(() => {
			const el = document.querySelector(".ca-tf__wrap");
			return el ? getComputedStyle(el).borderTopLeftRadius : null;
		});
		if (wrapRadius !== null) expect(wrapRadius).toBe("13px");
	});

	test("ca.components is registered after every other kit layer", async ({ page }) => {
		await gotoReady(page, "/docs/inputs/button/");
		const order = await page.evaluate(() => {
			const names: string[] = [];
			const walk = (rules: CSSRuleList) => {
				for (const r of Array.from(rules)) {
					if (r instanceof CSSLayerStatementRule) names.push(...r.nameList);
					else if (r instanceof CSSLayerBlockRule) names.push(r.name);
					if ("cssRules" in r && !(r instanceof CSSStyleRule))
						walk((r as CSSGroupingRule).cssRules);
				}
			};
			for (const sheet of Array.from(document.styleSheets)) walk(sheet.cssRules);
			return [...new Set(names)].filter((n) => n.startsWith("ca."));
		});
		expect(order.at(-1)).toBe("ca.components");
		expect(order.indexOf("ca.reset")).toBeLessThan(order.indexOf("ca.components"));
	});
});
