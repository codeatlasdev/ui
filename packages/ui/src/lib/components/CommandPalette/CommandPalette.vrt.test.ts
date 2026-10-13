import { page } from "vitest/browser";
import { settled } from "../../../../tests/settled";
import { overlayVrt } from "../../../../tests/vrt";
import Matrix from "./CommandPaletteMatrix.test.svelte";

overlayVrt(
	"CommandPalette",
	Matrix,
	async () => {
		await page.getByRole("button", { name: "Open" }).click();
		// Input focus happens in a rAF after open; settle so the focus state is deterministic.
		await settled();
	},
	"dialog"
);
