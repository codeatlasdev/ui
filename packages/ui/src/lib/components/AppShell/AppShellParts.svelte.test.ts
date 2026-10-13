import { Home, Settings, Users } from "@lucide/svelte";
import { createRawSnippet } from "svelte";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import { VIEWPORTS } from "../../../../tests/viewports";
import BottomNav from "./BottomNav.svelte";
import MobileHeader from "./MobileHeader.svelte";
import Panel from "./Panel.svelte";
import Rail from "./Rail.svelte";
import type { NavModule } from "./types";

const snip = (html: string) => createRawSnippet(() => ({ render: () => html }));

const modules: NavModule[] = [
	{
		id: "app",
		label: "Application",
		icon: Home,
		basePath: "/app",
		items: [
			{ id: "dash", label: "Dashboard", icon: Home, path: "/app/dashboard" },
			{ id: "novo", label: "What's new", icon: Home, path: "/app/news", isNew: true },
			{ id: "docs", label: "Messages", icon: Home, path: "/app/msgs", badge: 120 },
			{
				label: "Admin",
				collapsible: false,
				items: [{ id: "usr", label: "Users", icon: Users, path: "/app/users" }],
			},
		],
	},
	{
		id: "cfg",
		label: "Settings",
		icon: Settings,
		basePath: "/settings",
		items: [{ id: "gen", label: "General", icon: Settings, path: "/settings/general" }],
	},
];

describe("Rail", () => {
	it("renders one labelled button per module and flags the active one", async () => {
		const screen = await render(Rail, { modules, activeIndex: 1, onSelect: vi.fn() });
		await expect
			.element(screen.getByRole("navigation", { name: "Module navigation" }))
			.toBeVisible();
		await expect
			.element(screen.getByRole("button", { name: "Settings" }))
			.toHaveAttribute("aria-current", "page");
		await expect
			.element(screen.getByRole("button", { name: "Application" }))
			.not.toHaveAttribute("aria-current");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("calls onSelect with the module index", async () => {
		const onSelect = vi.fn();
		const screen = await render(Rail, { modules, activeIndex: 0, onSelect });
		await screen.getByRole("button", { name: "Settings" }).click();
		expect(onSelect).toHaveBeenCalledExactlyOnceWith(1);
	});

	it("is operable with the keyboard", async () => {
		const onSelect = vi.fn();
		const screen = await render(Rail, { modules, activeIndex: 0, onSelect });
		screen.getByRole("button", { name: "Application" }).element().focus();
		await userEvent.keyboard("{Tab}");
		await userEvent.keyboard("{Enter}");
		expect(onSelect).toHaveBeenCalledExactlyOnceWith(1);
	});

	it("renders brand and bottom slots; the default mark is decorative", async () => {
		const screen = await render(Rail, {
			modules,
			activeIndex: 0,
			onSelect: vi.fn(),
			brand: snip("<span>Logo</span>"),
			bottom: snip("<button type='button'>Profile</button>"),
		});
		await expect.element(screen.getByText("Logo")).toBeVisible();
		await expect.element(screen.getByRole("button", { name: "Profile" })).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("hides the default CA mark from the accessibility tree", async () => {
		const screen = await render(Rail, { modules, activeIndex: 0, onSelect: vi.fn() });
		expect(screen.container.querySelector(".ca-rail__logo")?.getAttribute("aria-hidden")).toBe(
			"true"
		);
	});
});

describe("Panel", () => {
	it("renders the active module title and its links with hrefs", async () => {
		const screen = await render(Panel, {
			modules,
			activeModuleIndex: 0,
			pathname: "/app/dashboard",
			show: true,
			panelW: 200,
		});
		await expect
			.element(screen.getByRole("complementary", { name: "Section navigation" }))
			.toBeVisible();
		await expect.element(screen.getByText("Application")).toBeVisible();
		await expect
			.element(screen.getByRole("link", { name: "Dashboard" }))
			.toHaveAttribute("href", "/app/dashboard");
		await expect
			.element(screen.getByRole("link", { name: "Users" }))
			.toHaveAttribute("href", "/app/users");
		await expect.element(screen.getByText("Admin")).toBeVisible();
	});

	it("marks only the matching link (exact or nested path) as current", async () => {
		const screen = await render(Panel, {
			modules,
			activeModuleIndex: 0,
			pathname: "/app/users/42",
			show: true,
			panelW: 200,
		});
		await expect
			.element(screen.getByRole("link", { name: "Users" }))
			.toHaveAttribute("aria-current", "page");
		await expect
			.element(screen.getByRole("link", { name: "Dashboard" }))
			.not.toHaveAttribute("aria-current");
	});

	it("exposes badge count (capped at 99+) and the new-dot with accessible names", async () => {
		const screen = await render(Panel, {
			modules,
			activeModuleIndex: 0,
			pathname: "/app/dashboard",
			show: true,
			panelW: 200,
		});
		await expect.element(screen.getByLabelText("120 unread")).toHaveTextContent("99+");
		await expect.element(screen.getByLabelText("New")).toBeInTheDocument();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("renders nothing when hidden and fully collapsed", async () => {
		const screen = await render(Panel, {
			modules,
			activeModuleIndex: 0,
			pathname: "/app/dashboard",
			show: false,
			panelW: 0,
		});
		expect(screen.container.querySelector(".ca-panel")).toBeNull();
	});

	it("stays mounted while animating closed (panelW > 1)", async () => {
		const screen = await render(Panel, {
			modules,
			activeModuleIndex: 0,
			pathname: "/app/dashboard",
			show: false,
			panelW: 40,
		});
		expect(screen.container.querySelector(".ca-panel")).not.toBeNull();
	});

	it("uses the panelW prop as its rendered width", async () => {
		const screen = await render(Panel, {
			modules,
			activeModuleIndex: 0,
			pathname: "/app/dashboard",
			show: true,
			panelW: 200,
		});
		await expect
			.poll(() => screen.container.querySelector(".ca-panel")?.getBoundingClientRect().width)
			.toBe(200);
	});
});

describe("BottomNav", () => {
	it("is visible on mobile with a button per module and current state", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		const screen = await render(BottomNav, { modules, activeIndex: 0, onSelect: vi.fn() });
		const nav = screen.getByRole("navigation", { name: "Module navigation" });
		await expect.element(nav).toBeVisible();
		await expect
			.element(nav.getByRole("button", { name: "Application" }))
			.toHaveAttribute("aria-current", "page");
		await expect
			.element(nav.getByRole("button", { name: "Settings" }))
			.not.toHaveAttribute("aria-current");
		await settled();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("is hidden on desktop", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(BottomNav, { modules, activeIndex: 0, onSelect: vi.fn() });
		expect(screen.container.querySelector(".ca-bottom-nav")?.checkVisibility()).toBe(false);
	});

	it("calls onSelect with the module index", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		const onSelect = vi.fn();
		const screen = await render(BottomNav, { modules, activeIndex: 0, onSelect });
		await screen.getByRole("button", { name: "Settings" }).click();
		expect(onSelect).toHaveBeenCalledExactlyOnceWith(1);
	});

	it("shows at most 5 modules", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		const many = Array.from({ length: 7 }, (_, i) => ({
			...modules[0],
			id: `m${i}`,
			label: `Mod ${i}`,
		}));
		const screen = await render(BottomNav, { modules: many, activeIndex: 0, onSelect: vi.fn() });
		expect(screen.getByRole("button").elements()).toHaveLength(5);
	});

	it("touch targets are at least 44px tall", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		const screen = await render(BottomNav, { modules, activeIndex: 0, onSelect: vi.fn() });
		const rect = screen
			.getByRole("button", { name: "Application" })
			.element()
			.getBoundingClientRect();
		expect(rect.height).toBeGreaterThanOrEqual(44);
	});
});

describe("MobileHeader", () => {
	it("renders the title inside a banner landmark", async () => {
		const screen = await render(MobileHeader, { title: "Documents" });
		await expect.element(screen.getByRole("banner")).toBeVisible();
		await expect.element(screen.getByText("Documents")).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("renders leading and trailing slots", async () => {
		const screen = await render(MobileHeader, {
			title: "Documents",
			leading: snip("<span>Brand</span>"),
			trailing: snip("<button type='button'>Menu</button>"),
		});
		await expect.element(screen.getByText("Brand")).toBeVisible();
		await expect.element(screen.getByRole("button", { name: "Menu" })).toBeVisible();
	});

	it("titleSlot replaces the plain title text", async () => {
		const screen = await render(MobileHeader, {
			title: "Ignored",
			titleSlot: snip("<button type='button'>Session 1</button>"),
		});
		await expect.element(screen.getByRole("button", { name: "Session 1" })).toBeVisible();
		expect(screen.getByText("Ignored").elements()).toHaveLength(0);
	});
});
