import { page } from "vitest/browser";
import { overlayVrt } from "../../../../tests/vrt";
import Matrix from "./DropdownMenuMatrix.test.svelte";

overlayVrt(
	"DropdownMenu",
	Matrix,
	async () => {
		await page.getByRole("button", { name: "Options" }).click();
	},
	"menu"
);
