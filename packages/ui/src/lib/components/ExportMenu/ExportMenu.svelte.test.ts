import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import Harness from "./ExportMenu.test.svelte";

describe("ExportMenu", () => {
	it("lists CSV and JSON and exports the chosen format", async () => {
		const onexport = vi.fn();
		const screen = await render(Harness, { onexport });
		await screen.getByRole("button", { name: "Export" }).click();
		await expect.element(screen.getByRole("menuitem", { name: "JSON" })).toBeVisible();
		await screen.getByRole("menuitem", { name: "CSV" }).click();
		expect(onexport).toHaveBeenCalledOnce();
		const e = onexport.mock.calls[0][0];
		expect(e).toMatchObject({ format: "csv", filename: "results.csv", rows: 2 });
		expect(e.content).toBe("domain,price\r\na.com,12\r\nb.com,8\r\n");
	});

	it("offers only the requested formats", async () => {
		const screen = await render(Harness, { formats: ["json"] });
		await screen.getByRole("button", { name: "Export" }).click();
		await expect.element(screen.getByRole("menuitem", { name: "JSON" })).toBeVisible();
		expect(screen.getByRole("menuitem", { name: "CSV" }).elements().length).toBe(0);
	});

	it("is disabled with no rows", async () => {
		const screen = await render(Harness, { data: [] });
		await expect.element(screen.getByRole("button", { name: "Export" })).toBeDisabled();
	});

	it("has no axe violations closed and open", async () => {
		const screen = await render(Harness, {});
		expect(await checkA11y(screen.container)).toHaveNoViolations();
		await screen.getByRole("button", { name: "Export" }).click();
		await expect.element(screen.getByRole("menuitem", { name: "CSV" })).toBeVisible();
		expect(
			await checkA11y(document.querySelector('[role="menu"]') as HTMLElement)
		).toHaveNoViolations();
	});
});
