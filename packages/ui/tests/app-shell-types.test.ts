import { describe, expect, it } from "bun:test";
import {
	collectPaths,
	findActiveItemPath,
	findActiveModuleIndex,
	firstModulePath,
	isItemActive,
	isNavSection,
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
		basePath: "/painel",
		items: [
			item("/painel/inicio"),
			{ label: "Gestão", items: [item("/painel/clientes"), item("/painel/pedidos")] },
		],
	},
	{
		id: "cfg",
		label: "Config",
		icon,
		basePath: "/config",
		pathPrefixes: ["/conta", "/billing"],
		items: [{ label: "Vazio", items: [] }, item("/config/geral")],
	},
	{ id: "empty", label: "Empty", icon, basePath: "/vazio", items: [] },
];

describe("isItemActive", () => {
	it("matches the exact path and nested children", () => {
		expect(isItemActive(item("/painel/clientes"), "/painel/clientes")).toBe(true);
		expect(isItemActive(item("/painel/clientes"), "/painel/clientes/42/editar")).toBe(true);
	});

	it("does not match a sibling that merely shares the prefix", () => {
		expect(isItemActive(item("/painel/cli"), "/painel/clientes")).toBe(false);
	});

	it("does not match a parent of the item", () => {
		expect(isItemActive(item("/painel/clientes"), "/painel")).toBe(false);
	});

	it("ignores trailing slashes (trailingSlash: always sites)", () => {
		expect(isItemActive(item("/admin/users/"), "/admin/users/new/")).toBe(true);
		expect(isItemActive(item("/admin/users"), "/admin/users/")).toBe(true);
		expect(isItemActive(item("/admin/users/"), "/admin/user-roles/")).toBe(false);
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
			"/painel/inicio",
			"/painel/clientes",
			"/painel/pedidos",
			"/config/geral",
		]);
	});
});

describe("findActiveModuleIndex", () => {
	it("matches basePath", () => {
		expect(findActiveModuleIndex(modules, "/config/geral")).toBe(1);
	});

	it("matches pathPrefixes", () => {
		expect(findActiveModuleIndex(modules, "/billing/faturas")).toBe(1);
	});

	it("falls back to 0 when nothing matches", () => {
		expect(findActiveModuleIndex(modules, "/outra")).toBe(0);
	});
});

describe("findActiveItemPath", () => {
	it("finds a top-level item", () => {
		expect(findActiveItemPath(modules, "/painel/inicio")).toBe("/painel/inicio");
	});

	it("finds an item inside a section, including nested routes", () => {
		expect(findActiveItemPath(modules, "/painel/pedidos/9")).toBe("/painel/pedidos");
	});

	it("returns the first matching item when an earlier item is a path prefix (order matters)", () => {
		const m: NavModule[] = [{ ...modules[0], items: [item("/painel"), item("/painel/pedidos")] }];
		expect(findActiveItemPath(m, "/painel/pedidos")).toBe("/painel");
	});

	it("returns null when no item is active", () => {
		expect(findActiveItemPath(modules, "/nada")).toBeNull();
	});
});

describe("firstModulePath", () => {
	it("returns the first top-level item", () => {
		expect(firstModulePath(modules[0])).toBe("/painel/inicio");
	});

	it("skips empty sections and returns the next navigable item", () => {
		expect(firstModulePath(modules[1])).toBe("/config/geral");
	});

	it("returns the first item of a leading section", () => {
		const m: NavModule = { ...modules[0], items: [{ items: [item("/a/b")] }, item("/z")] };
		expect(firstModulePath(m)).toBe("/a/b");
	});

	it("falls back to basePath for a module without items", () => {
		expect(firstModulePath(modules[2])).toBe("/vazio");
	});
});
