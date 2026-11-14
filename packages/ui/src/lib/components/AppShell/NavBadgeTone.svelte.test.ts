import { Home, Settings, Users } from "@lucide/svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import { contrast } from "../../utils/color.js";
import BottomNav from "./BottomNav.svelte";
import Panel from "./Panel.svelte";
import Rail from "./Rail.svelte";
import type { NavItem, NavModule } from "./types";

// #1176: a nav badge says more than "unread": a return awaiting review (warning), a failed sync
// (error), a plain total (neutral). The tone is a token pair, and the meaning reaches the name as text.

type Tone = "brand" | "error" | "warning" | "neutral";
const FILL: Record<Tone, [string, string]> = {
	brand: ["var(--ca-brand-fill)", "var(--ca-brand-contrast)"],
	error: ["var(--ca-semantic-error-fill)", "var(--ca-semantic-error-contrast)"],
	warning: [
		"var(--ca-semantic-warning-fill, var(--ca-semantic-warning))",
		"var(--ca-semantic-warning-contrast)",
	],
	neutral: ["var(--ca-text-secondary)", "var(--ca-surface-base)"],
};

const html = document.documentElement;
afterEach(() => html.classList.remove("dark"));

/** Computed fill and label colour the token pair resolves to, read beside `el` (same scope). */
function expected(el: Element, tone: Tone): [string, string] {
	const probe = document.createElement("span");
	probe.style.setProperty("background-color", FILL[tone][0]);
	probe.style.setProperty("color", FILL[tone][1]);
	el.parentElement?.appendChild(probe);
	const cs = getComputedStyle(probe);
	const out: [string, string] = [cs.backgroundColor, cs.color];
	probe.remove();
	return out;
}
const painted = (el: Element): [string, string] => {
	const cs = getComputedStyle(el);
	return [cs.backgroundColor, cs.color];
};
/** Any CSS colour as `rgba()`, through a 1px canvas, for the contrast math. */
function rgba(color: string): string {
	const ctx = document.createElement("canvas").getContext("2d") as CanvasRenderingContext2D;
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, 1, 1);
	const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
	return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
}
const ratio = (el: Element) => {
	const [bg, fg] = painted(el);
	return contrast(rgba(fg), rgba(bg)) ?? 0;
};

const item = (id: string, extra: Partial<NavItem>): NavItem => ({
	id,
	label: id[0].toUpperCase() + id.slice(1),
	icon: Home,
	path: `/app/${id}`,
	...extra,
});
const items: NavItem[] = [
	item("inbox", { badge: 4 }),
	item("returns", { badge: 3, badgeTone: "warning", badgeLabel: "3 awaiting review" }),
	item("sync", { badge: 2, badgeTone: "error", badgeLabel: "2 failed" }),
	item("drafts", { badge: 7, badgeTone: "neutral", badgeLabel: "7 drafts" }),
];
const panelModules: NavModule[] = [
	{ id: "app", label: "Application", icon: Home, basePath: "/app", items },
];
const renderPanel = (list: NavItem[] = items) =>
	render(Panel, {
		modules: [{ ...panelModules[0], items: list }],
		activeModuleIndex: 0,
		pathname: "/app/inbox",
		show: true,
		panelW: 240,
	});
const itemBadge = (name: string) =>
	page.getByRole("link", { name }).element().querySelector(".ca-nav-item__badge") as HTMLElement;

const railModules: NavModule[] = [
	{ id: "home", label: "Home", icon: Home, basePath: "/", items: [], badge: 5 },
	{
		id: "ret",
		label: "Returns",
		icon: Users,
		basePath: "/ret",
		items: [],
		badge: "dot",
		badgeTone: "warning",
		badgeLabel: "3 pending",
	},
	{
		id: "drafts",
		label: "Drafts",
		icon: Settings,
		basePath: "/drafts",
		items: [],
		badge: 9,
		badgeTone: "neutral",
		badgeLabel: "9 drafts",
	},
];
const moduleBadge = (name: string) =>
	page
		.getByRole("button", { name, exact: true })
		.element()
		.querySelector(".ca-nav-module-badge") as HTMLElement;

describe("NavItem badgeTone (#1176)", () => {
	it("paints each tone from its token pair, >= 4.5:1", async () => {
		const screen = await renderPanel();
		const cases: [string, Tone][] = [
			["Returns 3 awaiting review", "warning"],
			["Sync 2 failed", "error"],
			["Drafts 7 drafts", "neutral"],
		];
		for (const scheme of ["light", "dark"]) {
			html.classList.toggle("dark", scheme === "dark");
			for (const [name, tone] of cases) {
				const badge = itemBadge(name);
				expect([name, badge.dataset.tone]).toEqual([name, tone]);
				expect([scheme, name, painted(badge)]).toEqual([scheme, name, expected(badge, tone)]);
				expect([scheme, name, ratio(badge) >= 4.5]).toEqual([scheme, name, true]);
			}
		}
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("badgeLabel replaces 'unread' in the link name", async () => {
		const screen = await renderPanel();
		for (const name of ["Returns 3 awaiting review", "Sync 2 failed", "Drafts 7 drafts"])
			await expect.element(screen.getByRole("link", { name, exact: true })).toBeVisible();
		expect(document.body.textContent).not.toContain("3 unread");
	});

	it("default stays brand and 'N unread'", async () => {
		const screen = await renderPanel();
		await expect
			.element(screen.getByRole("link", { name: "Inbox 4 unread", exact: true }))
			.toBeVisible();
		const badge = itemBadge("Inbox 4 unread");
		expect(badge.hasAttribute("data-tone")).toBe(false);
		expect(painted(badge)).toEqual(expected(badge, "brand"));
	});
});

describe("NavModule badgeTone (#1176)", () => {
	it("warning dot and neutral count read their tokens", async () => {
		const screen = await render(Rail, { modules: railModules, activeIndex: 0, onSelect: vi.fn() });
		const dot = moduleBadge("Returns, 3 pending");
		expect(dot.classList.contains("ca-nav-module-badge--dot")).toBe(true);
		expect(dot.dataset.tone).toBe("warning");
		const count = moduleBadge("Drafts, 9 drafts");
		for (const scheme of ["light", "dark"]) {
			html.classList.toggle("dark", scheme === "dark");
			expect([scheme, getComputedStyle(dot).backgroundColor]).toEqual([
				scheme,
				expected(dot, "warning")[0],
			]);
			expect([scheme, painted(count)]).toEqual([scheme, expected(count, "neutral")]);
			expect([scheme, ratio(count) >= 4.5]).toEqual([scheme, true]);
		}
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("default module badge stays brand", async () => {
		await render(Rail, { modules: railModules, activeIndex: 0, onSelect: vi.fn() });
		const badge = moduleBadge("Home, 5 unread");
		expect(badge.hasAttribute("data-tone")).toBe(false);
		expect(painted(badge)).toEqual(expected(badge, "brand"));
	});

	it("More dot takes the tone of a hidden badge", async () => {
		await page.viewport(390, 844);
		const mods: NavModule[] = [
			{ id: "home", label: "Home", icon: Home, basePath: "/", items: [] },
			{ id: "team", label: "Team", icon: Users, basePath: "/team", items: [] },
			{
				id: "sync",
				label: "Sync",
				icon: Settings,
				basePath: "/sync",
				items: [],
				badge: "dot",
				badgeTone: "error",
				badgeLabel: "Failed",
			},
		];
		await render(BottomNav, { modules: mods, activeIndex: 0, onSelect: vi.fn(), primary: 2 });
		const dot = document.querySelector(".ca-bottom-nav [aria-haspopup] .ca-nav-module-badge");
		expect((dot as HTMLElement | null)?.dataset.tone).toBe("error");
	});
});

describe("non-brand tone without badgeLabel (#1176)", () => {
	// devWarn prints once per key per page: the silent renders run first, then the ones that warn.
	it("dev: warns once for an item and once for a module", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const hits = () => warn.mock.calls.filter((c) => String(c[0]).includes("badgeLabel")).length;
		try {
			await renderPanel();
			await render(Rail, { modules: railModules, activeIndex: 0, onSelect: vi.fn() });
			await settled();
			expect(hits()).toBe(0);
			await renderPanel([item("late", { badge: 1, badgeTone: "warning" })]);
			await expect.poll(hits).toBe(1);
			const bare: NavModule = { ...railModules[1], badgeLabel: undefined };
			await render(Rail, { modules: [bare], activeIndex: 0, onSelect: vi.fn() });
			await expect.poll(hits).toBe(2);
		} finally {
			warn.mockRestore();
		}
	});
});
