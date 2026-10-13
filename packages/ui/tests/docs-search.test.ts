import { describe, expect, it } from "bun:test";
import { fold, searchDocs } from "../src/lib/components/Docs/search.js";
import type { DocsSearchEntry } from "../src/lib/components/Docs/types.js";

const index: DocsSearchEntry[] = [
	{
		href: "/guia/configuracao",
		title: "Configuração",
		section: "Guia",
		description: "Como configurar o projeto",
		headings: [
			{ text: "Variáveis de ambiente", id: "env" },
			{ text: "Arquivo de configuração", id: "arquivo" },
		],
		text: "Defina as variáveis antes de iniciar.",
	},
	{
		href: "/api/pedidos",
		title: "Pedidos",
		section: "API",
		description: "Endpoints de pedidos",
		headings: [{ text: "Criar pedido", id: "criar" }],
		text: "Use POST para criar. A configuração padrão serve na maioria dos casos.",
	},
	{
		href: "/guia/instalacao",
		title: "Instalação",
		section: "Guia",
		description: "Instale o pacote",
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
		expect(hits[0]).toMatchObject({ href: "/guia/configuracao", kind: "page", context: "Guia" });
	});

	it("ranks a title hit above a body-only hit", () => {
		const pages = searchDocs(index, "configuracao").filter((r) => r.kind === "page");
		expect(pages.map((p) => p.href)).toEqual(["/guia/configuracao", "/api/pedidos"]);
	});

	it("requires every term to match", () => {
		expect(searchDocs(index, "pedido inexistente")).toEqual([]);
		expect(searchDocs(index, "criar pedido").map((r) => r.href)).toContain("/api/pedidos#criar");
	});

	it("emits heading hits with an anchor href and the page title as context", () => {
		const heading = searchDocs(index, "variaveis").find((r) => r.kind === "heading");
		expect(heading).toEqual({
			href: "/guia/configuracao#env",
			title: "Variáveis de ambiente",
			context: "Configuração",
			kind: "heading",
		});
	});

	it("matches body text and description", () => {
		expect(searchDocs(index, "bun add")[0].href).toBe("/guia/instalacao");
		expect(searchDocs(index, "endpoints")[0].href).toBe("/api/pedidos");
	});

	it("honours the limit", () => {
		expect(searchDocs(index, "a", 2)).toHaveLength(2);
	});

	it("ranks a title prefix above a mid-title match", () => {
		const idx: DocsSearchEntry[] = [
			{ href: "/b", title: "Guia de Botão", section: "S", description: "", headings: [], text: "" },
			{ href: "/a", title: "Botão", section: "S", description: "", headings: [], text: "" },
		];
		expect(searchDocs(idx, "botao").map((r) => r.href)).toEqual(["/a", "/b"]);
	});
});
