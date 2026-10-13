import { createRawSnippet } from "svelte";
import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { VIEWPORTS } from "../../../../tests/viewports";
import AuthCard from "./AuthCard.svelte";
import AuthLayout from "./AuthLayout.svelte";

const snip = (html: string) => createRawSnippet(() => ({ render: () => html }));

describe("AuthLayout", () => {
	it("renders the logo link (default name/href), an aside and the form column", async () => {
		const screen = await render(AuthLayout, { children: snip("<h1>Entrar</h1>") });
		await expect.element(screen.getByRole("main")).toBeVisible();
		const logo = screen.getByRole("link", { name: "CodeAtlas UI" });
		await expect.element(logo).toHaveAttribute("href", "/");
		await expect.element(screen.getByRole("complementary")).toBeVisible();
		await expect.element(screen.getByRole("heading", { level: 1, name: "Entrar" })).toBeVisible();
	});

	it("skip link jumps to the form column, the only <main id=main>", async () => {
		const screen = await render(AuthLayout, { children: snip("<h1>Entrar</h1>") });
		await userEvent.tab();
		await expect.element(screen.getByRole("link", { name: "Skip to content" })).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		expect(document.activeElement?.id).toBe("main");
		expect(document.activeElement?.tagName).toBe("MAIN");
		expect(document.querySelectorAll("#main")).toHaveLength(1);
	});

	it("honours logoName and logoHref; the mark is decorative", async () => {
		const screen = await render(AuthLayout, {
			logoName: "Minha App",
			logoMark: "MA",
			logoHref: "/home",
		});
		const logo = screen.getByRole("link", { name: "Minha App" });
		await expect.element(logo).toHaveAttribute("href", "/home");
		const mark = screen.container.querySelector(".ca-auth__mark");
		expect(mark?.textContent).toBe("MA");
		expect(mark?.getAttribute("aria-hidden")).toBe("true");
	});

	it("brand snippet replaces the text mark", async () => {
		const screen = await render(AuthLayout, {
			brand: snip("<svg role='img' aria-label='Logo SVG'></svg>"),
		});
		expect(screen.container.querySelector(".ca-auth__mark")).toBeNull();
		await expect.element(screen.getByRole("img", { name: "Logo SVG" })).toBeInTheDocument();
	});

	it("renders the decorative panel slot with its CSS variables", async () => {
		const screen = await render(AuthLayout, { panel: snip("<blockquote>Frase</blockquote>") });
		await expect.element(screen.getByText("Frase")).toBeVisible();
		const slot = screen.container.querySelector(".ca-auth__slot") as HTMLElement;
		expect(slot.style.getPropertyValue("--panel-text-primary").trim()).toBe("oklch(1 0 0 / 0.95)");
	});

	it("keeps blobs out of the accessibility tree", async () => {
		const screen = await render(AuthLayout, {});
		expect(screen.container.querySelector(".ca-auth__blobs")?.getAttribute("aria-hidden")).toBe(
			"true"
		);
	});

	it("shows the compact brand strip at 375px and hides it at 1280px", async () => {
		const screen = await render(AuthLayout, {
			logoName: "Minha App",
			logoMark: "MA",
			children: snip("<h1>Entrar</h1>"),
		});
		const strip = screen.container.querySelector(".ca-auth__mobile-brand") as HTMLElement;
		await page.viewport(375, 800);
		expect(getComputedStyle(strip).display).toBe("flex");
		expect(strip.getAttribute("href")).toBe("/");
		expect(strip.textContent).toContain("Minha App");
		await page.viewport(1280, 720);
		expect(getComputedStyle(strip).display).toBe("none");
	});

	it("mobileBrand=false omits the strip", async () => {
		const screen = await render(AuthLayout, { mobileBrand: false });
		expect(screen.container.querySelector(".ca-auth__mobile-brand")).toBeNull();
	});

	it.each([
		["desktop", VIEWPORTS.desktop],
		["mobile", VIEWPORTS.mobile],
	] as const)("has no axe violations on %s", async (_name, vp) => {
		await page.viewport(vp[0], vp[1]);
		const screen = await render(AuthLayout, {
			panel: snip("<blockquote>Frase</blockquote>"),
			children: snip("<h1>Entrar</h1>"),
		});
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});

describe("AuthCard", () => {
	it("renders title (h1), subtitle, body and footer", async () => {
		const screen = await render(AuthCard, {
			title: "Bem-vindo",
			subtitle: "Entre para continuar",
			children: snip("<label>Email <input type='email' /></label>"),
			footer: snip("<a href='/cadastro'>Criar conta</a>"),
		});
		await expect
			.element(screen.getByRole("heading", { level: 1, name: "Bem-vindo" }))
			.toBeVisible();
		await expect.element(screen.getByText("Entre para continuar")).toBeVisible();
		await expect.element(screen.getByRole("textbox", { name: "Email" })).toBeVisible();
		await expect
			.element(screen.getByRole("link", { name: "Criar conta" }))
			.toHaveAttribute("href", "/cadastro");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("omits header and footer when not provided", async () => {
		const screen = await render(AuthCard, { children: snip("<p>corpo</p>") });
		expect(screen.getByRole("heading").elements()).toHaveLength(0);
		expect(screen.container.querySelector(".ca-auth-card__header")).toBeNull();
		expect(screen.container.querySelector(".ca-auth-card__footer")).toBeNull();
	});

	it("subtitle alone still renders a header", async () => {
		const screen = await render(AuthCard, { subtitle: "Só subtítulo" });
		await expect.element(screen.getByText("Só subtítulo")).toBeVisible();
		expect(screen.getByRole("heading").elements()).toHaveLength(0);
	});
});
