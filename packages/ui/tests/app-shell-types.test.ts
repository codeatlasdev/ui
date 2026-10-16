import { describe, expect, it } from "bun:test";
import {
	collectPaths,
	findActiveItemPath,
	findActiveModuleIndex,
	firstModulePath,
	isItemActive,
	isNavSection,
	matchModuleIndex,
	type NavItem,
	type NavModule,
	type NavSection,
} from "../src/lib/components/AppShell/types.js";

const icon = (() => null) as unknown as NavItem["icon"];
const item = (path: string): NavItem => ({ id: path, label: path, icon, path });

const modules: NavModule[] = [
	{
		id: "home",
		label: "Home",
		icon,
		basePath: "/dashboard",
		items: [
			item("/dashboard/home"),
			{ label: "Management", items: [item("/dashboard/customers"), item("/dashboard/orders")] },
		],
	},
	{
		id: "cfg",
		label: "Config",
		icon,
		basePath: "/settings",
		pathPrefixes: ["/account", "/billing"],
		items: [{ label: "Empty section", items: [] }, item("/settings/general")],
	},
	{ id: "empty", label: "Empty", icon, basePath: "/empty", items: [] },
];

describe("isItemActive", () => {
	it("matches the exact path and nested children", () => {
		expect(isItemActive(item("/dashboard/customers"), "/dashboard/customers")).toBe(true);
		expect(isItemActive(item("/dashboard/customers"), "/dashboard/customers/42/edit")).toBe(true);
	});

	it("does not match a sibling that merely shares the prefix", () => {
		expect(isItemActive(item("/dashboard/cus"), "/dashboard/customers")).toBe(false);
	});

	it("does not match a parent of the item", () => {
		expect(isItemActive(item("/dashboard/customers"), "/dashboard")).toBe(false);
	});

	it("ignores trailing slashes (trailingSlash: always sites)", () => {
		expect(isItemActive(item("/admin/users/"), "/admin/users/new/")).toBe(true);
		expect(isItemActive(item("/admin/users"), "/admin/users/")).toBe(true);
		expect(isItemActive(item("/admin/users/"), "/admin/user-roles/")).toBe(false);
	});
});

describe("root path (#274)", () => {
	it("an item at '/' is active only on '/'", () => {
		expect(isItemActive(item("/"), "/")).toBe(true);
		expect(isItemActive(item("/"), "")).toBe(true);
		expect(isItemActive(item("/"), "/settings")).toBe(false);
		expect(isItemActive(item("/"), "/settings/general/")).toBe(false);
	});

	it("an item at '/' wins no other item's page in findActiveItemPath", () => {
		const m: NavModule[] = [
			{ ...modules[0], basePath: "/", items: [item("/"), item("/x")] },
			{ ...modules[1], items: [item("/settings")] },
		];
		expect(findActiveItemPath(m, "/")).toBe("/");
		expect(findActiveItemPath(m, "/x")).toBe("/x");
		expect(findActiveItemPath(m, "/settings")).toBe("/settings");
	});
});

describe("matchModuleIndex", () => {
	const root: NavModule[] = [
		{ id: "a", label: "A", icon, basePath: "/", items: [item("/"), item("/x")] },
		{ id: "b", label: "B", icon, basePath: "/settings", pathPrefixes: ["/account"], items: [] },
	];

	it("basePath '/' matches '/' and unmatched paths only after every other module", () => {
		expect(matchModuleIndex(root, "/")).toBe(0);
		expect(matchModuleIndex(root, "/x")).toBe(0);
		expect(matchModuleIndex(root, "/settings")).toBe(1);
		expect(matchModuleIndex(root, "/settings/general")).toBe(1);
		expect(matchModuleIndex(root, "/account/me")).toBe(1);
	});

	it("the longest matching prefix wins, whatever the module order", () => {
		const nested: NavModule[] = [
			{ id: "a", label: "A", icon, basePath: "/app", items: [] },
			{ id: "b", label: "B", icon, basePath: "/app/admin", items: [] },
		];
		expect(matchModuleIndex(nested, "/app/admin/users")).toBe(1);
		expect(matchModuleIndex(nested, "/app/home")).toBe(0);
	});

	it("matches whole path segments, ignoring trailing slashes", () => {
		expect(matchModuleIndex(root, "/settings/")).toBe(1);
		expect(matchModuleIndex([{ ...root[1], basePath: "/settings/" }], "/settings")).toBe(0);
		expect(matchModuleIndex([root[1]], "/settingsfoo")).toBe(-1);
	});

	it("returns -1 when no module matches", () => {
		expect(matchModuleIndex([root[1]], "/other")).toBe(-1);
	});
});

describe("isNavSection", () => {
	it("distinguishes sections from items", () => {
		expect(isNavSection({ items: [] } as NavSection)).toBe(true);
		expect(isNavSection(item("/x"))).toBe(false);
	});
});

describe("collectPaths", () => {
	it("flattens items and section items in order", () => {
		expect(collectPaths(modules)).toEqual([
			"/dashboard/home",
			"/dashboard/customers",
			"/dashboard/orders",
			"/settings/general",
		]);
	});
});

describe("findActiveModuleIndex", () => {
	it("matches basePath", () => {
		expect(findActiveModuleIndex(modules, "/settings/general")).toBe(1);
	});

	it("matches pathPrefixes", () => {
		expect(findActiveModuleIndex(modules, "/billing/invoices")).toBe(1);
	});

	it("falls back to 0 when nothing matches", () => {
		expect(findActiveModuleIndex(modules, "/other")).toBe(0);
	});
});

describe("findActiveItemPath", () => {
	it("finds a top-level item", () => {
		expect(findActiveItemPath(modules, "/dashboard/home")).toBe("/dashboard/home");
	});

	it("finds an item inside a section, including nested routes", () => {
		expect(findActiveItemPath(modules, "/dashboard/orders/9")).toBe("/dashboard/orders");
	});

	it("returns the first matching item when an earlier item is a path prefix (order matters)", () => {
		const m: NavModule[] = [
			{ ...modules[0], items: [item("/dashboard"), item("/dashboard/orders")] },
		];
		expect(findActiveItemPath(m, "/dashboard/orders")).toBe("/dashboard");
	});

	it("returns null when no item is active", () => {
		expect(findActiveItemPath(modules, "/nothing")).toBeNull();
	});
});

describe("firstModulePath", () => {
	it("returns the first top-level item", () => {
		expect(firstModulePath(modules[0])).toBe("/dashboard/home");
	});

	it("skips empty sections and returns the next navigable item", () => {
		expect(firstModulePath(modules[1])).toBe("/settings/general");
	});

	it("returns the first item of a leading section", () => {
		const m: NavModule = { ...modules[0], items: [{ items: [item("/a/b")] }, item("/z")] };
		expect(firstModulePath(m)).toBe("/a/b");
	});

	it("falls back to basePath for a module without items", () => {
		expect(firstModulePath(modules[2])).toBe("/empty");
	});
});
