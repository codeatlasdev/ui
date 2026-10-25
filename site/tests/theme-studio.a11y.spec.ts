import { expectNoViolations, gotoReady, makeAxe, settle, test } from "./fixtures";

// The generic route sweep sees /theme/ closed. These are the states it cannot reach.
test.describe("theme studio a11y", () => {
	test("default, every panel tab and the overlays screen have no violations", async ({
		page,
	}, testInfo) => {
		// Eight axe passes and three overlay openings in one test: 23 to 29 s measured, and the default 30 s lost to a
		// loaded machine in the release run (axe walks every node, so the budget follows the work, as in routes.axe).
		test.setTimeout(90_000);
		await gotoReady(page, "/theme/");
		await expectNoViolations(await makeAxe(page).analyze(), testInfo, "default");

		for (const tab of ["Looks", "Generate"]) {
			await page.getByRole("tab", { name: tab }).click();
			await expectNoViolations(await makeAxe(page).analyze(), testInfo, tab.toLowerCase());
		}

		await page.getByRole("tab", { name: "Controls" }).click();
		for (const name of ["Style", "Shape", "Type", "Motion and components"])
			await page.getByRole("button", { name }).click();
		await settle(page);
		await expectNoViolations(await makeAxe(page).analyze(), testInfo, "all-groups-open");

		await page.getByRole("button", { name: /Preview screen/ }).click();
		await page.getByRole("option", { name: "Overlays" }).click();
		await page.getByRole("switch", { name: "Light and dark side by side" }).click();
		await settle(page);
		await expectNoViolations(await makeAxe(page).analyze(), testInfo, "overlays-compare");

		// The real overlays, one at a time in their settled open state (an opening animation is not a contrast sample).
		for (const name of ["Dialog", "Drawer", "Sheet"]) {
			await page.getByRole("button", { name, exact: true }).first().click();
			await settle(page);
			await expectNoViolations(
				await makeAxe(page).analyze(),
				testInfo,
				`overlays-${name.toLowerCase()}`
			);
			await page.locator("dialog[open] .ca-layer-close").first().click();
			await settle(page);
		}
	});
});
