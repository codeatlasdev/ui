import { createRawSnippet } from "svelte";
import { describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import SiteHeader from "./SiteHeader.svelte";
import Harness from "./SiteHeaderHarness.test.svelte";
import Marketing from "./SiteHeaderMarketing.test.svelte";

describe("SiteHeader", () => {
	it("standalone: banner with no toggle and no breadcrumb", async () => {
		const screen = await render(SiteHeader, {
			trailing: createRawSnippet(() => ({ render: () => "<button type='button'>Perfil</button>" })),
		});
		await expect.element(screen.getByRole("banner")).toBeVisible();
		await expect.element(screen.getByRole("button", { name: "Perfil" })).toBeVisible();
		expect(screen.getByRole("navigation", { name: "Breadcrumb" }).elements()).toHaveLength(0);
		expect(screen.getByRole("button", { name: /navigation/ }).elements()).toHaveLength(0);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("builds a breadcrumb from the shell pathname; last crumb is current and not a link", async () => {
		const screen = await render(Harness);
		const bc = screen.getByRole("navigation", { name: "Breadcrumb" });
		await expect
			.element(bc.getByRole("link", { name: "Painel" }))
			.toHaveAttribute("href", "/painel");
		await expect
			.element(bc.getByRole("link", { name: "Usuarios" }))
			.toHaveAttribute("href", "/painel/usuarios");
		expect(bc.getByRole("link").elements()).toHaveLength(2);
		await expect.element(bc.getByText("Novo cadastro")).toHaveAttribute("aria-current", "page");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("renders no breadcrumb for the root path", async () => {
		const screen = await render(Harness, { pathname: "/" });
		expect(screen.getByRole("navigation", { name: "Breadcrumb" }).elements()).toHaveLength(0);
	});

	it("toggle button reflects panelOpen in its name and calls togglePanel", async () => {
		const onToggle = vi.fn();
		const screen = await render(Harness, { onToggle, panelOpen: true });
		await screen.getByRole("button", { name: "Close navigation" }).click();
		expect(onToggle).toHaveBeenCalledOnce();
	});

	it("toggle is labelled 'Open navigation' when the panel is closed", async () => {
		const screen = await render(Harness, { panelOpen: false });
		await expect.element(screen.getByRole("button", { name: "Open navigation" })).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("marketing nav + locale + two CTAs do not overflow at 390px", async () => {
		await page.viewport(390, 800);
		const screen = await render(Marketing);
		expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
		const header = screen.getByRole("banner").element() as HTMLElement;
		for (const el of header.querySelectorAll<HTMLElement>("*")) {
			if (getComputedStyle(el).display === "none") continue;
			expect(el.getBoundingClientRect().right, el.className || el.tagName).toBeLessThanOrEqual(
				window.innerWidth
			);
		}
		await expect.element(screen.getByRole("link", { name: "Get started" })).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
		screen.unmount();
		await page.viewport(1280, 800);
		const wide = await render(Marketing);
		await expect.element(wide.getByRole("link", { name: "Pricing" })).toBeVisible();
	});
});
