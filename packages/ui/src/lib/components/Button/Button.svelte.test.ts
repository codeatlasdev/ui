import { createRawSnippet } from "svelte";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import Button from "./Button.svelte";

const label = (text: string) => createRawSnippet(() => ({ render: () => `<span>${text}</span>` }));

describe("Button", () => {
	it("calls onclick when enabled", async () => {
		const onclick = vi.fn();
		const screen = await render(Button, { children: label("Salvar"), onclick });
		await screen.getByRole("button", { name: "Salvar" }).click();
		expect(onclick).toHaveBeenCalledOnce();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("loading sets aria-busy, disables and blocks onclick", async () => {
		const onclick = vi.fn();
		const screen = await render(Button, { children: label("Salvar"), loading: true, onclick });
		const btn = screen.getByRole("button", { name: "Salvar" });
		await expect.element(btn).toHaveAttribute("aria-busy", "true");
		await expect.element(btn).toBeDisabled();
		await btn.click({ force: true });
		expect(onclick).not.toHaveBeenCalled();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("announces when loading finishes, but not on mount or while loading", async () => {
		const polite = () => document.querySelector('[data-ca-announcer="polite"]')?.textContent ?? "";
		const screen = await render(Button, { children: label("Salvar"), loading: true });
		await new Promise((r) => setTimeout(r, 100));
		expect(polite()).toBe("");
		await screen.rerender({ loading: false });
		await expect.poll(polite).toBe("Finished loading");
	});

	it.each(["filled", "glass", "outlined", "ghost", "destructive"] as const)(
		"variant %s renders its class",
		async (variant) => {
			const screen = await render(Button, { children: label("X"), variant, size: "lg" });
			const btn = screen.getByRole("button");
			await expect.element(btn).toHaveClass(`ca-btn--${variant}`);
			await expect.element(btn).toHaveClass("ca-btn--lg");
		}
	);

	it("href with loading renders a disabled link", async () => {
		const screen = await render(Button, { children: label("Ir"), href: "/x", loading: true });
		const link = screen.getByRole("link", { name: "Ir" });
		await expect.element(link).toHaveAttribute("aria-disabled", "true");
		await expect.element(link).toHaveAttribute("tabindex", "-1");
	});
});
