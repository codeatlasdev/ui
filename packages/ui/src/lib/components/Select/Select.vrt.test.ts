import { page } from "vitest/browser";
import { matrixVrt, overlayVrt } from "../../../../tests/vrt";
import SelectMatrix from "./SelectMatrix.test.svelte";
import SelectOverlay from "./SelectOverlay.test.svelte";

matrixVrt("Select", SelectMatrix);

overlayVrt(
	"Select-open",
	SelectOverlay,
	async () => {
		await page.getByRole("button", { name: "Open" }).click();
	},
	"listbox"
);
