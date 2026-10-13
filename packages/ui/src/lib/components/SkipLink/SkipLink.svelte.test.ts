import { createRawSnippet } from "svelte";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import SkipLinkHarness from "./SkipLinkHarness.test.svelte";

describe("SkipLink", () => {
	it("is the first tab stop, shows on focus and moves focus to #main on Enter", async () => {
		const screen = await render(SkipLinkHarness, {});
		await userEvent.tab();
		const link = screen.getByRole("link", { name: "Skip to content" });
		expect(document.activeElement).toBe(link.element());
		// Off-screen until focused.
		const top = link.element().getBoundingClientRect().top;
		expect(top).toBeGreaterThanOrEqual(0);
		await userEvent.keyboard("{Enter}");
		expect(document.activeElement?.id).toBe("main");
		expect(
			await checkA11y(screen.container, { rules: { region: { enabled: false } } })
		).toHaveNoViolations();
	});

	it("is hidden off-screen until focused", async () => {
		const screen = await render(SkipLinkHarness, {});
		const link = screen.getByRole("link", { name: "Skip to content" }).element();
		expect(link.getBoundingClientRect().bottom).toBeLessThanOrEqual(0);
	});

	it("custom label and href", async () => {
		const children = createRawSnippet(() => ({ render: () => "<span>Pular</span>" }));
		const screen = await render(SkipLinkHarness, {
			props: { href: "#conteudo", target: "conteudo", children },
		});
		const link = screen.getByRole("link", { name: "Pular" });
		await expect.element(link).toHaveAttribute("href", "#conteudo");
		(link.element() as HTMLElement).focus();
		await userEvent.keyboard("{Enter}");
		expect(document.activeElement?.id).toBe("conteudo");
	});
});
