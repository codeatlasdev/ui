import { createRawSnippet } from "svelte";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import IconButton from "./IconButton.svelte";

const icon = createRawSnippet(() => ({
	render: () => `<svg aria-hidden="true" width="16" height="16"></svg>`,
}));

describe("IconButton", () => {
	it("is named by aria-label and calls onclick", async () => {
		const onclick = vi.fn();
		const screen = await render(IconButton, { "aria-label": "Close", children: icon, onclick });
		await screen.getByRole("button", { name: "Close" }).click();
		expect(onclick).toHaveBeenCalledOnce();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("loading sets aria-busy, disables and blocks onclick", async () => {
		const onclick = vi.fn();
		const screen = await render(IconButton, {
			"aria-label": "Save",
			children: icon,
			loading: true,
			onclick,
		});
		const btn = screen.getByRole("button", { name: "Save" });
		await expect.element(btn).toHaveAttribute("aria-busy", "true");
		await expect.element(btn).toBeDisabled();
		await btn.click({ force: true });
		expect(onclick).not.toHaveBeenCalled();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("disabled blocks onclick without aria-busy", async () => {
		const onclick = vi.fn();
		const screen = await render(IconButton, {
			"aria-label": "Edit",
			children: icon,
			disabled: true,
			onclick,
		});
		const btn = screen.getByRole("button", { name: "Edit" });
		await expect.element(btn).toBeDisabled();
		await expect.element(btn).not.toHaveAttribute("aria-busy");
		await btn.click({ force: true });
		expect(onclick).not.toHaveBeenCalled();
	});

	it.each(["glass", "filled", "text"] as const)(
		"variant %s keeps the button accessible",
		async (variant) => {
			const screen = await render(IconButton, {
				"aria-label": "Action",
				children: icon,
				variant,
				size: "lg",
			});
			await expect.element(screen.getByRole("button", { name: "Action" })).toBeVisible();
			expect(await checkA11y(screen.container)).toHaveNoViolations();
		}
	);

	it("warns in dev when no accessible name is given", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		// Bypasses the required `aria-label` type, as a JS caller or spread would.
		const props = { children: icon } as unknown as Parameters<typeof render<typeof IconButton>>[1];
		await render(IconButton, props);
		expect(warn).toHaveBeenCalledWith(
			expect.stringMatching(/^\[ca-ui\] <IconButton> has no accessible name/)
		);
		warn.mockRestore();
	});

	it("stays quiet when aria-label names it", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		await render(IconButton, { "aria-label": "Ok", children: icon });
		expect(warn).not.toHaveBeenCalled();
		warn.mockRestore();
	});
});

describe("IconButton tone=neutral (#357)", () => {
	it("outlined: border and icon are neutral, not the brand colour", async () => {
		const brand = await render(IconButton, {
			"aria-label": "A",
			children: icon,
			variant: "outlined",
		});
		const neutral = await render(IconButton, {
			"aria-label": "B",
			children: icon,
			variant: "outlined",
			tone: "neutral",
			"aria-expanded": false,
		});
		const b = getComputedStyle(brand.container.querySelector("button") as HTMLElement);
		const nEl = neutral.container.querySelector("button") as HTMLElement;
		const n = getComputedStyle(nEl);
		expect(n.color).not.toBe(b.color);
		expect(n.borderTopColor).not.toBe(b.borderTopColor);
		expect(nEl.getAttribute("aria-expanded")).toBe("false");
		expect(await checkA11y(neutral.container)).toHaveNoViolations();
	});

	it("disabled outlined neutral keeps the shared disabled look", async () => {
		const screen = await render(IconButton, {
			"aria-label": "Off",
			children: icon,
			variant: "outlined",
			tone: "neutral",
			disabled: true,
		});
		const probe = document.createElement("span");
		probe.style.color = "var(--ca-text-disabled)";
		document.body.append(probe);
		expect(getComputedStyle(screen.getByRole("button").element()).color).toBe(
			getComputedStyle(probe).color
		);
		probe.remove();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});
