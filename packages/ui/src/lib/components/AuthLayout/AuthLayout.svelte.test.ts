import { createRawSnippet } from "svelte";
import { afterEach, describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { VIEWPORTS } from "../../../../tests/viewports";
import { BUILTIN_PRESETS } from "../../theme/builtins.js";
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
		expect(getComputedStyle(slot).getPropertyValue("--panel-text-primary").trim()).toBe(
			"color-mix(in oklab, oklch(1 0 0) 95%, transparent)"
		);
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

	it("panelHidden=lg hides the panel below 1200px, md keeps it from 900px", async () => {
		const lg = await render(AuthLayout, { panelHidden: "lg", panel: mapPanel });
		const md = await render(AuthLayout, { panel: mapPanel });
		await page.viewport(960, 800);
		const shown = (s: typeof lg) =>
			getComputedStyle(s.container.querySelector(".ca-auth__panel") as HTMLElement).display;
		expect(shown(lg)).toBe("none");
		expect(shown(md)).not.toBe("none");
		await page.viewport(1280, 800);
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

describe("AuthLayout panelTone", () => {
	const panel = snip("<blockquote>Quote</blockquote>");
	const bg = (el: Element | null) => getComputedStyle(el as HTMLElement).backgroundImage;

	it("brand (default) paints the gradient and renders the blobs", async () => {
		await page.viewport(1280, 800);
		const screen = await render(AuthLayout, { panel });
		const aside = screen.container.querySelector(".ca-auth__panel");
		expect(bg(aside)).toContain("linear-gradient");
		expect(screen.container.querySelector(".ca-auth__blobs")).not.toBeNull();
	});

	it("flat paints a solid --ca-auth-panel-bg and renders no blobs", async () => {
		await page.viewport(1280, 800);
		const screen = await render(AuthLayout, { panel, panelTone: "flat" });
		const aside = screen.container.querySelector(".ca-auth__panel") as HTMLElement;
		expect(bg(aside)).toBe("none");
		expect(screen.container.querySelector(".ca-auth__blobs")).toBeNull();
		aside.style.setProperty("--ca-auth-panel-bg", "rgb(1, 2, 3)");
		expect(getComputedStyle(aside).backgroundColor).toBe("rgb(1, 2, 3)");
	});

	it("flat flips the panel text to the theme text color and has no axe violations", async () => {
		await page.viewport(1280, 800);
		const quote = snip("<p class='auth-quote__text'>Quote</p>");
		const flat = await render(AuthLayout, { panel: quote, panelTone: "flat" });
		const text = flat.container.querySelector(".auth-quote__text") as HTMLElement;
		const rgb = getComputedStyle(text).color;
		expect(await checkA11y(flat.container)).toHaveNoViolations();
		flat.unmount();
		const brand = await render(AuthLayout, { panel: quote });
		const brandText = brand.container.querySelector(".auth-quote__text") as HTMLElement;
		expect(getComputedStyle(brandText).color).not.toBe(rgb);
	});

	it("--ca-auth-panel-bg also overrides the brand gradient", async () => {
		await page.viewport(1280, 800);
		const screen = await render(AuthLayout, { panel });
		const aside = screen.container.querySelector(".ca-auth__panel") as HTMLElement;
		aside.style.setProperty("--ca-auth-panel-bg", "rgb(9, 8, 7)");
		expect(getComputedStyle(aside).backgroundColor).toBe("rgb(9, 8, 7)");
		expect(bg(aside)).toBe("none");
	});

	it("a flat surface style makes the unset tone flat; brand opts back in", async () => {
		await page.viewport(1280, 800);
		document.documentElement.dataset.style = "flat";
		try {
			const auto = await render(AuthLayout, { panel });
			expect(bg(auto.container.querySelector(".ca-auth__panel"))).toBe("none");
			const blobs = auto.container.querySelector(".ca-auth__blobs") as HTMLElement;
			expect(getComputedStyle(blobs).display).toBe("none");
			const brand = await render(AuthLayout, { panel, panelTone: "brand" });
			expect(bg(brand.container.querySelector(".ca-auth__panel"))).toContain("linear-gradient");
			const brandBlobs = brand.container.querySelector(".ca-auth__blobs") as HTMLElement;
			expect(getComputedStyle(brandBlobs).display).not.toBe("none");
		} finally {
			delete document.documentElement.dataset.style;
		}
	});

	// #440: the secondary and tertiary levels were alpha mixes of the panel foreground tuned for
	// white over the dark brand gradient; over a flat (raised) surface they measured 4.39:1 (dark)
	// and 2.21:1 (light), under the 4.5:1 floor for small text.
	for (const scheme of ["light", "dark"] as const) {
		it(`flat panel text levels pass axe color-contrast (${scheme})`, async () => {
			await page.viewport(1280, 800);
			const root = document.documentElement;
			root.classList.toggle("dark", scheme === "dark");
			root.dataset.style = "outlined";
			try {
				const quote = snip(
					"<div><p class='auth-quote__text'>Quote</p>" +
						"<footer class='auth-quote__attr'>Attribution</footer>" +
						"<p style='font-size:var(--ca-font-size-body2);color:var(--panel-text-secondary)'>Secondary</p>" +
						"<p style='font-size:var(--ca-font-size-body2);color:var(--panel-text-tertiary)'>Tertiary</p></div>"
				);
				const screen = await render(AuthLayout, { panel: quote });
				const aside = screen.container.querySelector(".ca-auth__panel") as HTMLElement;
				expect(bg(aside)).toBe("none");
				expect(await checkA11y(screen.container)).toHaveNoViolations();
			} finally {
				root.classList.remove("dark");
				delete root.dataset.style;
			}
		});
	}
});

// #472: the compact brand strip's mark (white on brand) must hold 4.5:1 in dark on every preset.
describe("AuthLayout mobile brand mark contrast (#472)", () => {
	afterEach(async () => {
		document.documentElement.classList.remove("dark");
		await page.viewport(...VIEWPORTS.desktop);
	});

	it.each(BUILTIN_PRESETS.map((p) => p.id))("%s dark at 390px: no color-contrast", async (id) => {
		await page.viewport(...VIEWPORTS.mobile);
		document.documentElement.classList.add("dark");
		const screen = await render(AuthLayout, {
			logoName: "My App",
			logoMark: "MA",
			children: snip("<h1>Sign in</h1>"),
		});
		screen.container.setAttribute("data-preset", id);
		const mark = screen.container.querySelector(".ca-auth__mobile-mark") as HTMLElement;
		expect(getComputedStyle(mark).display).toBe("flex");
		expect(await checkA11y(mark, { runOnly: ["color-contrast"] })).toHaveNoViolations();
	});
});
