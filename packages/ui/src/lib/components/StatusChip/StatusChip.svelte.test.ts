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

	// #1232: a long label in a narrow flex cell wrapped to a second line and spilled out of the fixed-height pill.
	it("keeps a long label on one line inside a narrow flex cell", async () => {
		const screen = await render(StatusChip, {
			status: "success",
			label: "Running healthy (2 restarts)",
		});
		const cell = screen.container as HTMLElement;
		cell.style.cssText = "display:flex;width:110px";
		const chip = screen.getByRole("status").element() as HTMLElement;
		const text = [...chip.querySelectorAll("*"), chip]
			.flatMap((el) => [...el.childNodes])
			.find((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim()) as Text;
		const range = document.createRange();
		range.selectNodeContents(text);
		const lines = new Set([...range.getClientRects()].map((r) => Math.round(r.top)));
		expect(lines.size).toBe(1);
		expect(chip.getBoundingClientRect().right).toBeLessThanOrEqual(
			cell.getBoundingClientRect().right + 0.5
		);
		const label = chip.querySelector(".ca-status-chip__label") as HTMLElement;
		expect(getComputedStyle(label).textOverflow).toBe("ellipsis");
		expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
	});

	it("merges a custom class", async () => {
		const screen = await render(StatusChip, { status: "info", label: "X", class: "custom" });
		await expect.element(screen.getByRole("status")).toHaveClass("custom");
	});
});
