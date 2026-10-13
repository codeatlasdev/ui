import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import StatusChip from "./StatusChip.svelte";

describe("StatusChip", () => {
	it.each(["success", "warning", "error", "info", "neutral"] as const)(
		"status %s exposes its label as a status and passes axe",
		async (status) => {
			const screen = await render(StatusChip, { status, label: `Status ${status}` });
			const chip = screen.getByRole("status");
			await expect.element(chip).toBeVisible();
			await expect.element(chip).toHaveTextContent(`Status ${status}`);
			await expect.element(chip).toHaveClass(`ca-status-chip--${status}`);
			expect(await checkA11y(screen.container)).toHaveNoViolations();
		}
	);

	it("merges a custom class", async () => {
		const screen = await render(StatusChip, { status: "info", label: "X", class: "custom" });
		await expect.element(screen.getByRole("status")).toHaveClass("custom");
	});
});
