import { devices, test } from "@playwright/test";

test.use({ ...devices["Pixel 7"], colorScheme: "dark" });
test("probe", async ({ page }) => {
	await page.goto("/changelog/4.6.0/");
	await page.waitForTimeout(1500);
	const r = await page.evaluate(() =>
		[...document.querySelectorAll("main input")].map((e) => {
			const host = e.matches("input, select") ? (e.closest("[class*='__wrap'], label") ?? e) : e;
			const b = host.getBoundingClientRect();
			const i = e.getBoundingClientRect();
			return `${(e as HTMLInputElement).getAttribute("aria-label") ?? e.id} in ${e.closest("figure")?.querySelector(".live__title")?.textContent} host=${host.className} ${Math.round(b.width)}x${Math.round(b.height)} input=${Math.round(i.width)}x${Math.round(i.height)} type=${(e as HTMLInputElement).type} cls=${e.className.slice(0, 40)}`;
		})
	);
	console.log(r.join("\n"));
});
