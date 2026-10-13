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
		const screen = await render(IconButton, { "aria-label": "Fechar", children: icon, onclick });
		await screen.getByRole("button", { name: "Fechar" }).click();
		expect(onclick).toHaveBeenCalledOnce();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("loading sets aria-busy, disables and blocks onclick", async () => {
		const onclick = vi.fn();
		const screen = await render(IconButton, {
			"aria-label": "Salvar",
			children: icon,
			loading: true,
			onclick,
		});
		const btn = screen.getByRole("button", { name: "Salvar" });
		await expect.element(btn).toHaveAttribute("aria-busy", "true");
		await expect.element(btn).toBeDisabled();
		await btn.click({ force: true });
		expect(onclick).not.toHaveBeenCalled();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("disabled blocks onclick without aria-busy", async () => {
		const onclick = vi.fn();
		const screen = await render(IconButton, {
			"aria-label": "Editar",
			children: icon,
			disabled: true,
			onclick,
		});
		const btn = screen.getByRole("button", { name: "Editar" });
		await expect.element(btn).toBeDisabled();
		await expect.element(btn).not.toHaveAttribute("aria-busy");
		await btn.click({ force: true });
		expect(onclick).not.toHaveBeenCalled();
	});

	it.each(["glass", "filled", "text"] as const)(
		"variant %s keeps the button accessible",
		async (variant) => {
			const screen = await render(IconButton, {
				"aria-label": "Ação",
				children: icon,
				variant,
				size: "lg",
			});
			await expect.element(screen.getByRole("button", { name: "Ação" })).toBeVisible();
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
