import { page } from "vitest/browser";
import { overlayVrt } from "../../../../tests/vrt";
import Matrix from "./DrawerMatrix.test.svelte";

const open = async () => {
	await page.getByRole("button", { name: "Open" }).click();
};

overlayVrt("Drawer-right", Matrix, open, "dialog", { side: "right" });
overlayVrt("Drawer-left", Matrix, open, "dialog", { side: "left" });
overlayVrt("Drawer-bottom", Matrix, open, "dialog", { side: "bottom" });
