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
		const screen = await render(AuthLayout, { children: snip("<h1>Sign in</h1>") });
		await expect.element(screen.getByRole("main")).toBeVisible();
		const logo = screen.getByRole("link", { name: "CodeAtlas UI" });
		await expect.element(logo).toHaveAttribute("href", "/");
		await expect.element(screen.getByRole("complementary")).toBeVisible();
		await expect.element(screen.getByRole("heading", { level: 1, name: "Sign in" })).toBeVisible();
	});

	it("skip link jumps to the form column, the only <main id=main>", async () => {
		const screen = await render(AuthLayout, { children: snip("<h1>Sign in</h1>") });
		await userEvent.tab();
		await expect.element(screen.getByRole("link", { name: "Skip to content" })).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		expect(document.activeElement?.id).toBe("main");
		expect(document.activeElement?.tagName).toBe("MAIN");
		expect(document.querySelectorAll("#main")).toHaveLength(1);
	});

	it("honours logoName and logoHref; the mark is decorative", async () => {
		const screen = await render(AuthLayout, {
			logoName: "My App",
			logoMark: "MA",
			logoHref: "/home",
		});
		const logo = screen.getByRole("link", { name: "My App" });
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

	it("brand snippet alone renders no default logoName in either place", async () => {
		const screen = await render(AuthLayout, {
			brand: snip("<svg role='img' aria-label='Wordmark'></svg>"),
		});
		expect(screen.container.querySelector(".ca-auth__name")).toBeNull();
		expect(screen.container.querySelector(".ca-auth__mobile-name")).toBeNull();
		expect(screen.container.textContent).not.toContain("CodeAtlas UI");
	});

	it("brand snippet plus explicit logoName renders both", async () => {
		const screen = await render(AuthLayout, {
			brand: snip("<svg role='img' aria-label='Mark'></svg>"),
			logoName: "Acme",
		});
		expect(screen.container.querySelector(".ca-auth__name")?.textContent).toBe("Acme");
		expect(screen.container.querySelector(".ca-auth__mobile-name")?.textContent).toBe("Acme");
	});

	it("renders the decorative panel slot with its CSS variables", async () => {
		const screen = await render(AuthLayout, { panel: snip("<blockquote>Quote</blockquote>") });
		await expect.element(screen.getByText("Quote")).toBeVisible();
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
			logoName: "My App",
			logoMark: "MA",
			children: snip("<h1>Sign in</h1>"),
		});
		const strip = screen.container.querySelector(".ca-auth__mobile-brand") as HTMLElement;
		await page.viewport(375, 800);
		expect(getComputedStyle(strip).display).toBe("flex");
		expect(strip.getAttribute("href")).toBe("/");
		expect(strip.textContent).toContain("My App");
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
			panel: snip("<blockquote>Quote</blockquote>"),
			children: snip("<h1>Sign in</h1>"),
		});
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});

describe("AuthCard", () => {
	it("renders title (h1), subtitle, body and footer", async () => {
		const screen = await render(AuthCard, {
			title: "Welcome",
			subtitle: "Sign in to continue",
			children: snip("<label>Email <input type='email' /></label>"),
			footer: snip("<a href='/sign-up'>Create account</a>"),
		});
		await expect.element(screen.getByRole("heading", { level: 1, name: "Welcome" })).toBeVisible();
		await expect.element(screen.getByText("Sign in to continue")).toBeVisible();
		await expect.element(screen.getByRole("textbox", { name: "Email" })).toBeVisible();
		await expect
			.element(screen.getByRole("link", { name: "Create account" }))
			.toHaveAttribute("href", "/sign-up");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("omits header and footer when not provided", async () => {
		const screen = await render(AuthCard, { children: snip("<p>body</p>") });
		expect(screen.getByRole("heading").elements()).toHaveLength(0);
		expect(screen.container.querySelector(".ca-auth-card__header")).toBeNull();
		expect(screen.container.querySelector(".ca-auth-card__footer")).toBeNull();
	});

	it("subtitle alone still renders a header", async () => {
		const screen = await render(AuthCard, { subtitle: "Subtitle only" });
		await expect.element(screen.getByText("Subtitle only")).toBeVisible();
		expect(screen.getByRole("heading").elements()).toHaveLength(0);
	});
});

describe("AuthLayout layout options", () => {
	const mapPanel = snip("<div data-testid='map'>Map</div>");
	const rect = (el: Element | null) => (el as HTMLElement).getBoundingClientRect();

	it("panelSide=right puts the panel after the form column", async () => {
		await page.viewport(1280, 800);
		const screen = await render(AuthLayout, {
			panelSide: "right",
			panel: mapPanel,
			children: snip("<h1>Sign in</h1>"),
		});
		const panel = rect(screen.container.querySelector(".ca-auth__panel"));
		const col = rect(screen.container.querySelector(".ca-auth__col"));
		expect(panel.left).toBeGreaterThanOrEqual(col.right - 1);
	});

	it("panelSide defaults to left", async () => {
		await page.viewport(1280, 800);
		const screen = await render(AuthLayout, { panel: mapPanel, children: snip("<h1>x</h1>") });
		const panel = rect(screen.container.querySelector(".ca-auth__panel"));
		const col = rect(screen.container.querySelector(".ca-auth__col"));
		expect(panel.right).toBeLessThanOrEqual(col.left + 1);
	});

	it("panelBleed fills the panel edge to edge, with no logo and no blobs", async () => {
		await page.viewport(1280, 800);
		const screen = await render(AuthLayout, { panelBleed: true, panel: mapPanel });
		const aside = rect(screen.container.querySelector(".ca-auth__panel"));
		const map = rect(screen.container.querySelector("[data-testid=map]"));
		expect(Math.round(map.width)).toBe(Math.round(aside.width));
		expect(Math.round(map.height)).toBe(Math.round(aside.height));
		expect(screen.container.querySelector(".ca-auth__blobs")).toBeNull();
		expect(screen.container.querySelector(".ca-auth__panel .ca-auth__logo")).toBeNull();
	});

	it("panelBleed panel is sticky to the viewport height", async () => {
		await page.viewport(1280, 600);
		const screen = await render(AuthLayout, {
			panelBleed: true,
			panel: mapPanel,
			children: snip("<div style='height:2000px'>tall form</div>"),
		});
		const aside = screen.container.querySelector(".ca-auth__panel") as HTMLElement;
		window.scrollTo(0, 800);
		expect(Math.round(aside.getBoundingClientRect().top)).toBe(0);
		expect(Math.round(aside.getBoundingClientRect().height)).toBe(600);
		window.scrollTo(0, 0);
	});

	it("panelHidden=lg hides the panel below 1024px, md keeps it from 900px", async () => {
		const lg = await render(AuthLayout, { panelHidden: "lg", panel: mapPanel });
		const md = await render(AuthLayout, { panel: mapPanel });
		await page.viewport(960, 800);
		const shown = (s: typeof lg) =>
			getComputedStyle(s.container.querySelector(".ca-auth__panel") as HTMLElement).display;
		expect(shown(lg)).toBe("none");
		expect(shown(md)).not.toBe("none");
		await page.viewport(1100, 800);
		expect(shown(lg)).not.toBe("none");
	});

	it("does not mount the panel snippet while the panel is hidden", async () => {
		await page.viewport(390, 800);
		const screen = await render(AuthLayout, {
			panelBleed: true,
			panelHidden: "lg",
			panel: mapPanel,
		});
		expect(screen.container.querySelector("[data-testid=map]")).toBeNull();
		await page.viewport(1280, 800);
		await expect.element(screen.getByTestId("map")).toBeInTheDocument();
	});

	it("header snippet renders above the form, sticky, and yields the mobile strip", async () => {
		await page.viewport(390, 800);
		const screen = await render(AuthLayout, {
			header: snip("<nav aria-label='Top'><a href='/x'>Entrar</a></nav>"),
			children: snip("<h1>Sign in</h1>"),
		});
		const header = screen.container.querySelector(".ca-auth__header") as HTMLElement;
		expect(header).not.toBeNull();
		expect(getComputedStyle(header).position).toBe("sticky");
		expect(screen.container.querySelector(".ca-auth__mobile-brand")).toBeNull();
		expect(
			header.compareDocumentPosition(screen.container.querySelector("h1") as Element) &
				Node.DOCUMENT_POSITION_FOLLOWING
		).toBeTruthy();
	});

	it("align=start left-aligns the form column; center is the default", async () => {
		await page.viewport(1280, 800);
		const start = await render(AuthLayout, { align: "start" });
		const center = await render(AuthLayout, {});
		const items = (s: typeof start) =>
			getComputedStyle(s.container.querySelector(".ca-auth__col") as HTMLElement).alignItems;
		expect(items(start)).toBe("flex-start");
		expect(items(center)).toBe("center");
	});

	it("the divider between columns is the subtle hairline, not a strong border", async () => {
		await page.viewport(1280, 800);
		const screen = await render(AuthLayout, { panelBleed: true, panel: mapPanel });
		const col = screen.container.querySelector(".ca-auth__col") as HTMLElement;
		const sh = getComputedStyle(col).boxShadow;
		const probe = document.createElement("div");
		probe.style.boxShadow = "inset 1px 0 0 var(--ca-outline-subtle)";
		document.body.append(probe);
		const subtle = getComputedStyle(probe).boxShadow.match(
			/rgba?\([^)]*\)|oklch\([^)]*\)|color\([^)]*\)/
		)?.[0];
		probe.remove();
		expect(subtle).toBeTruthy();
		expect(sh).toContain(subtle as string);
	});

	it.each([
		["desktop", [1280, 800]],
		["mobile", [390, 800]],
	] as const)("reference layout has no axe violations on %s", async (_n, vp) => {
		await page.viewport(vp[0], vp[1]);
		const screen = await render(AuthLayout, {
			panelSide: "right",
			panelBleed: true,
			panelHidden: "lg",
			align: "start",
			header: snip("<nav aria-label='Top'><a href='/x'>Sign in</a></nav>"),
			panel: snip("<div role='img' aria-label='Map of pins'></div>"),
			children: snip("<h1>Sign in</h1>"),
		});
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});

describe("AuthCard variant", () => {
	it("plain renders the title at display size without the card chrome", async () => {
		const card = await render(AuthCard, { variant: "plain", title: "Join", subtitle: "Now" });
		const def = await render(AuthCard, { title: "Join" });
		const size = (s: typeof card) =>
			Number.parseFloat(
				getComputedStyle(s.container.querySelector(".ca-auth-card__title") as HTMLElement).fontSize
			);
		expect(size(card)).toBeGreaterThan(size(def));
		expect(
			card.container.querySelector(".ca-auth-card")?.classList.contains("ca-auth-card--plain")
		).toBe(true);
		expect(await checkA11y(card.container)).toHaveNoViolations();
	});
});
