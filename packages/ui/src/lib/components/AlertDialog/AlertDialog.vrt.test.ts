import { page } from "vitest/browser";
import { overlayVrt } from "../../../../tests/vrt";
import Matrix from "./AlertDialogMatrix.test.svelte";

const open = async () => {
	await page.getByRole("button", { name: "Open" }).click();
};

overlayVrt("AlertDialog", Matrix, open, "alertdialog");
overlayVrt("AlertDialog-destructive", Matrix, open, "alertdialog", { destructive: true });
