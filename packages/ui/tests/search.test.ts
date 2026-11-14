import { describe, expect, it } from "bun:test";
import { foldText, searchItems, searchScore, slugify } from "../src/lib/utils/search.js";

// Accented fixtures are deliberate: the subject is accent- and case-insensitive matching (#1142).

describe("foldText", () => {
	it("drops accents and case", () => {
		expect(foldText("Açúcar")).toBe("acucar");
		expect(foldText("SÃO João")).toBe("sao joao");
	});
});

describe("searchItems", () => {
	it("ignores accents and case on both sides", () => {
		const items = ["Açúcar", "Sal", "São Paulo", "João"];
		expect(searchItems(items, "acucar")).toEqual(["Açúcar"]);
		expect(searchItems(items, "ACÚCAR")).toEqual(["Açúcar"]);
		expect(searchItems(items, "joao")).toEqual(["João"]);
		expect(searchItems(items, "sao")).toEqual(["São Paulo"]);
		expect(searchItems(["Acucar"], "açúcar")).toEqual(["Acucar"]);
	});

	it("ranks exact, then prefix, then word start, then inside a word", () => {
		const items = ["Desaçucarado", "Pão de açúcar", "Sal", "Açúcar mascavo", "Açúcar"];
		expect(searchItems(items, "acucar")).toEqual([
			"Açúcar",
			"Açúcar mascavo",
			"Pão de açúcar",
			"Desaçucarado",
		]);
	});

	it("finds a word start after an earlier mid-word hit", () => {
		expect(searchItems(["Tabaco", "Bacia do Acre"], "ac")).toEqual(["Bacia do Acre", "Tabaco"]);
	});

	it("keeps source order between equal matches", () => {
		expect(searchItems(["Rio Branco", "Rio de Janeiro", "Rio Claro"], "rio")).toEqual([
			"Rio Branco",
			"Rio de Janeiro",
			"Rio Claro",
		]);
	});

	it("matches the words of the query in any order and field", () => {
		const rows = [
			{ name: "Maria Souza", city: "Recife" },
			{ name: "João Silva", city: "São Paulo" },
			{ name: "Ana Paula", city: "Rio" },
		];
		expect(searchItems(rows, "paulo sao", { keys: ["name", "city"] })).toEqual([rows[1]]);
		expect(searchItems(rows, "joao paulo", { keys: ["name", "city"] })).toEqual([rows[1]]);
		expect(searchItems(rows, "joao recife", { keys: ["name", "city"] })).toEqual([]);
	});

	it("ranks a phrase above separate words, an earlier key above a later one", () => {
		const rows = [
			{ id: 1, name: "Paula", email: "sao.joao@x.com" },
			{ id: 2, name: "Ana", email: "joao@x.com" },
			{ id: 3, name: "João", email: "j@x.com" },
			{ id: 4, name: "São João", email: "s@x.com" },
		];
		const ids = (q: string) =>
			searchItems(rows, q, { keys: ["name", (r) => r.email] }).map((r) => r.id);
		expect(ids("joao")).toEqual([3, 2, 4, 1]);
		expect(ids("sao joao")).toEqual([4, 1]);
		expect(ids("joao sao")).toEqual([4, 1]);
	});

	it("returns everything for an empty query and honours limit", () => {
		const items = ["b", "a", "ab"];
		expect(searchItems(items, "  ")).toEqual(["b", "a", "ab"]);
		expect(searchItems(items, "a", { limit: 1 })).toEqual(["a"]);
	});

	it("skips null and undefined fields", () => {
		const rows = [{ name: null }, { name: undefined }, { name: "Null" }];
		expect(searchItems(rows, "null", { keys: ["name"] })).toEqual([{ name: "Null" }]);
	});
});

describe("searchScore", () => {
	it("is 0 without a match and higher for a better one", () => {
		expect(searchScore("Sal", "acucar")).toBe(0);
		const exact = searchScore("Açúcar", "acucar");
		const prefix = searchScore("Açúcar mascavo", "acucar");
		const word = searchScore("Pão de açúcar", "acucar");
		const inside = searchScore("Desaçucarado", "acucar");
		expect(inside).toBeGreaterThan(0);
		expect(word).toBeGreaterThan(inside);
		expect(prefix).toBeGreaterThan(word);
		expect(exact).toBeGreaterThan(prefix);
	});

	it("takes several fields: every word must match one of them", () => {
		expect(searchScore(["João Silva", "São Paulo"], "silva paulo")).toBeGreaterThan(0);
		expect(searchScore(["João Silva", "São Paulo"], "silva recife")).toBe(0);
	});
});

describe("slugify", () => {
	it("gives an ASCII slug without accents", () => {
		expect(slugify("Etiqueta Térmica 10×5")).toBe("etiqueta-termica-10x5");
		expect(slugify("  --Olá, Mundo!--  ")).toBe("ola-mundo");
		expect(slugify("Ação & Reação")).toBe("acao-reacao");
	});

	it("drops apostrophes instead of splitting the word", () => {
		expect(slugify("Joana's Café")).toBe("joanas-cafe");
		expect(slugify("Olho d’Água")).toBe("olho-dagua");
	});

	it("spells out letters that do not decompose", () => {
		expect(slugify("Straße Æsir Øre Łódź")).toBe("strasse-aesir-ore-lodz");
		expect(slugify("ﬁle ½")).toBe("file-1-2");
	});

	it("is empty when nothing is left", () => {
		expect(slugify("")).toBe("");
		expect(slugify("¡¿!?")).toBe("");
	});
});
