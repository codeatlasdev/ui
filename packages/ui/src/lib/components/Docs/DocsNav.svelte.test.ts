import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import DocsNav from "./DocsNav.svelte";

const groups = [
	{
		label: "Getting started",
		items: [
			{ href: "/guide/start", title: "First steps" },
			{ href: "/guide/config", title: "Configuration" },
		],
	},
	{ label: "Reference", items: [{ href: "/api/send", title: "Send", badge: "POST" }] },
	{ label: "Empty", items: [] },
];

describe("DocsNav", () => {
	it("renders a labelled nav with group labels and links; passes axe", async () => {
		const screen = await render(DocsNav, { groups, pathname: "/guide/start", label: "Guide" });
		await expect.element(screen.getByRole("navigation", { name: "Guide" })).toBeVisible();
		await expect.element(screen.getByText("Getting started")).toBeVisible();
		await expect.element(screen.getByText("Reference")).toBeVisible();
		expect(screen.getByRole("link").elements()).toHaveLength(3);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("omits groups without items", async () => {
		const screen = await render(DocsNav, { groups, pathname: "/" });
		await expect.element(screen.getByText("Empty")).not.toBeInTheDocument();
	});

	it("marks only the current pathname with aria-current=page", async () => {
		const screen = await render(DocsNav, { groups, pathname: "/guide/config" });
		await expect
			.element(screen.getByRole("link", { name: "Configuration" }))
			.toHaveAttribute("aria-current", "page");
		await expect
			.element(screen.getByRole("link", { name: "First steps" }))
			.not.toHaveAttribute("aria-current");
	});

	it("renders the method badge next to the title", async () => {
		const screen = await render(DocsNav, { groups, pathname: "/" });
		await expect.element(screen.getByRole("link", { name: /Send/ })).toMatchTextContent("POST");
	});

	it("Tab walks the links in order and onNavigate fires on activation", async () => {
		const onNavigate = vi.fn();
		const screen = await render(DocsNav, { groups, pathname: "/", onNavigate });
		await userEvent.tab();
		await expect.element(screen.getByRole("link", { name: "First steps" })).toHaveFocus();
		await userEvent.tab();
		await expect.element(screen.getByRole("link", { name: "Configuration" })).toHaveFocus();
		// Prevent the real navigation so the test page stays put.
		screen.container.addEventListener("click", (e) => e.preventDefault());
		await userEvent.keyboard("{Enter}");
		expect(onNavigate).toHaveBeenCalledOnce();
	});
});
