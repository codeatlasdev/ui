import { describe, expect, it } from "bun:test";
import { fold, searchDocs } from "../src/lib/components/Docs/search.js";
import type { DocsSearchEntry } from "../src/lib/components/Docs/types.js";

// "Configuração" / "configuracao" are deliberate accented fixtures for the diacritic-folding tests.
const index: DocsSearchEntry[] = [
	{
		href: "/guide/configuracao",
		title: "Configuração",
		section: "Guide",
		description: "How to configure the project",
		headings: [
			{ text: "Environment variables", id: "env" },
			{ text: "Configuração file", id: "file" },
		],
		text: "Set the variables before starting.",
	},
	{
		href: "/api/orders",
		title: "Orders",
		section: "API",
		description: "Order endpoints",
		headings: [{ text: "Create order", id: "create" }],
		text: "Use POST to create. The default configuração works in most cases.",
	},
	{
		href: "/guide/installation",
		title: "Installation",
		section: "Guide",
		description: "Install the package",
		headings: [],
		text: "bun add @codeatlasdev/ui",
	},
];

describe("fold", () => {
	it("lowercases and strips diacritics", () => {
		expect(fold("Configuração Ção Ünï")).toBe("configuracao cao uni");
	});
});

describe("searchDocs", () => {
	it("returns nothing for blank queries", () => {
		expect(searchDocs(index, "")).toEqual([]);
		expect(searchDocs(index, "   ")).toEqual([]);
	});

	it("matches accent-insensitively", () => {
		const hits = searchDocs(index, "configuracao");
		expect(hits[0]).toMatchObject({ href: "/guide/configuracao", kind: "page", context: "Guide" });
	});

	it("ranks a title hit above a body-only hit", () => {
		const pages = searchDocs(index, "configuracao").filter((r) => r.kind === "page");
		expect(pages.map((p) => p.href)).toEqual(["/guide/configuracao", "/api/orders"]);
	});

	it("requires every term to match", () => {
		expect(searchDocs(index, "order nonexistent")).toEqual([]);
		expect(searchDocs(index, "create order").map((r) => r.href)).toContain("/api/orders#create");
	});

	it("emits heading hits with an anchor href and the page title as context", () => {
		const heading = searchDocs(index, "environment").find((r) => r.kind === "heading");
		expect(heading).toEqual({
			href: "/guide/configuracao#env",
			title: "Environment variables",
			context: "Configuração",
			kind: "heading",
		});
	});

	it("matches body text and description", () => {
		expect(searchDocs(index, "bun add")[0].href).toBe("/guide/installation");
		expect(searchDocs(index, "endpoints")[0].href).toBe("/api/orders");
	});

	it("honours the limit", () => {
		expect(searchDocs(index, "a", 2)).toHaveLength(2);
	});

	it("ranks a title prefix above a mid-title match", () => {
		const idx: DocsSearchEntry[] = [
			{
				href: "/b",
				title: "Guide to Button",
				section: "S",
				description: "",
				headings: [],
				text: "",
			},
			{ href: "/a", title: "Button", section: "S", description: "", headings: [], text: "" },
		];
		expect(searchDocs(idx, "button").map((r) => r.href)).toEqual(["/a", "/b"]);
	});
});
