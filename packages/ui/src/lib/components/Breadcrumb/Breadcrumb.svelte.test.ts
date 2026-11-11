import { createRawSnippet } from "svelte";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import Breadcrumb from "./Breadcrumb.svelte";

const items = [
	{ label: "Home", href: "/" },
	{ label: "Projects", href: "/projects" },
	{ label: "Atlas", href: "/projects/atlas" },
];

describe("Breadcrumb", () => {
	it("renders a labelled nav with an ordered list", async () => {
		const screen = await render(Breadcrumb, { items });
		await expect.element(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeVisible();
		await expect.element(screen.getByRole("list")).toBeVisible();
		await expect.element(screen.getByRole("listitem").first()).toBeVisible();
		expect(screen.getByRole("listitem").elements()).toHaveLength(3);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("links ancestors but renders the last item as the current page", async () => {
		const screen = await render(Breadcrumb, { items });
		await expect.element(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
		await expect
			.element(screen.getByRole("link", { name: "Projects" }))
			.toHaveAttribute("href", "/projects");
		await expect.element(screen.getByRole("link", { name: "Atlas" })).not.toBeInTheDocument();
		await expect.element(screen.getByText("Atlas")).toHaveAttribute("aria-current", "page");
	});

	it("hides separators from assistive tech and honours a custom separator", async () => {
		const screen = await render(Breadcrumb, { items, separator: ">" });
		const seps = screen.container.querySelectorAll(".ca-breadcrumb__sep");
		expect(seps).toHaveLength(2);
		for (const s of seps) {
			expect(s.getAttribute("aria-hidden")).toBe("true");
			expect(s.textContent).toBe(">");
		}
	});

	it("an item without href is plain text", async () => {
		const screen = await render(Breadcrumb, { items: [{ label: "Root" }, { label: "Leaf" }] });
		await expect.element(screen.getByRole("link")).not.toBeInTheDocument();
		await expect.element(screen.getByText("Root")).not.toHaveAttribute("aria-current");
		await expect.element(screen.getByText("Leaf")).toHaveAttribute("aria-current", "page");
	});
});

describe("Breadcrumb #694", () => {
	it("a separator snippet is drawn aria-hidden; the last item stays current", async () => {
		const separator = createRawSnippet(() => ({
			render: () => '<svg data-testid="chev" width="14" height="14"></svg>',
		}));
		const screen = await render(Breadcrumb, { items, separator });
		const seps = screen.container.querySelectorAll(".ca-breadcrumb__sep");
		expect(seps).toHaveLength(2);
		for (const s of seps) {
			expect(s.getAttribute("aria-hidden")).toBe("true");
			expect(s.querySelector("svg")).not.toBeNull();
			expect(s.textContent).toBe("");
		}
		await expect.element(screen.getByText("Atlas")).toHaveAttribute("aria-current", "page");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("a link snippet renders each non-current item", async () => {
		const link = createRawSnippet<[{ label: string; href?: string }]>((item) => ({
			render: () => `<a data-router href="${item().href}">${item().label}</a>`,
		}));
		const screen = await render(Breadcrumb, { items, link });
		const links = screen.container.querySelectorAll("a[data-router]");
		expect([...links].map((a) => a.textContent)).toEqual(["Home", "Projects"]);
		expect(links[1].getAttribute("href")).toBe("/projects");
		expect(screen.container.querySelectorAll("a")).toHaveLength(2);
		expect(getComputedStyle(links[0]).textDecorationLine).toBe("none");
		await expect.element(screen.getByText("Atlas")).toHaveAttribute("aria-current", "page");
	});

	it("an item without href skips the link snippet", async () => {
		const link = createRawSnippet<[{ label: string; href?: string }]>((item) => ({
			render: () => `<a data-router href="/x">${item().label}</a>`,
		}));
		const screen = await render(Breadcrumb, {
			items: [{ label: "Root" }, { label: "Mid", href: "/m" }, { label: "Leaf" }],
			link,
		});
		expect(
			[...screen.container.querySelectorAll("a[data-router]")].map((a) => a.textContent)
		).toEqual(["Mid"]);
	});

	it("type and radius tokens restyle the trail", async () => {
		const screen = await render(Breadcrumb, { items });
		const nav = screen.container.querySelector(".ca-breadcrumb") as HTMLElement;
		const list = screen.container.querySelector(".ca-breadcrumb__list") as HTMLElement;
		const linkEl = screen.container.querySelector(".ca-breadcrumb__link") as HTMLElement;
		const before = list.getBoundingClientRect().height;
		expect(getComputedStyle(list).fontSize).toBe("11.25px");
		expect(getComputedStyle(list).letterSpacing).toBe("normal");
		expect(getComputedStyle(linkEl).borderTopLeftRadius).toBe("0px");
		nav.style.setProperty("--ca-breadcrumb-size", "14px");
		nav.style.setProperty("--ca-breadcrumb-line-height", "30px");
		nav.style.setProperty("--ca-breadcrumb-tracking", "0.04em");
		nav.style.setProperty("--ca-breadcrumb-link-radius", "4px");
		expect(getComputedStyle(list).fontSize).toBe("14px");
		expect(getComputedStyle(list).lineHeight).toBe("30px");
		expect(getComputedStyle(list).letterSpacing).not.toBe("normal");
		expect(getComputedStyle(linkEl).borderTopLeftRadius).toBe("4px");
		expect(list.getBoundingClientRect().height).toBeGreaterThan(before);
	});
});
