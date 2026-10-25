import { expectNoViolations, gotoReady, makeAxe, test } from "./fixtures";

// The generic route sweep sees /theme/ closed. These are the states it cannot reach.
test.describe("theme studio a11y", () => {
	test("default, every panel tab and the overlays screen have no violations", async ({
		page,
	}, testInfo) => {
		await gotoReady(page, "/theme/");
		await expectNoViolations(await makeAxe(page).analyze(), testInfo, "default");

		for (const tab of ["Looks", "Generate"]) {
			await page.getByRole("tab", { name: tab }).click();
			await expectNoViolations(await makeAxe(page).analyze(), testInfo, tab.toLowerCase());
		}

		await page.getByRole("tab", { name: "Controls" }).click();
		for (const name of ["Style", "Shape", "Type", "Motion and components"])
			await page.getByRole("button", { name }).click();
		await expectNoViolations(await makeAxe(page).analyze(), testInfo, "all-groups-open");

		await page.getByRole("radio", { name: "Overlays" }).click();
		await page.getByRole("switch", { name: "Light and dark side by side" }).click();
		await expectNoViolations(await makeAxe(page).analyze(), testInfo, "overlays-compare");
	});
});
