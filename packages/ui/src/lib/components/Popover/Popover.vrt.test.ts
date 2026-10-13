import { expect } from "vitest";
import { page } from "vitest/browser";
import { overlayVrt } from "../../../../tests/vrt";
import Matrix from "./PopoverMatrix.test.svelte";

// The popover is now role="dialog" (named by its trigger), so the shared overlay helper applies.
overlayVrt(
	"Popover",
	Matrix,
	async () => {
		await page.getByRole("button", { name: "Details" }).click();
		await expect.element(page.getByText("Order summary")).toBeVisible();
	},
	"dialog"
);
