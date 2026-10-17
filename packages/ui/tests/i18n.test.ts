import { describe, expect, it } from "bun:test";
import { groups } from "../src/lib/i18n/all.js";

const en = Object.fromEntries(Object.values(groups).map((g) => [g.id, g.builtin.en]));
const ptBR = Object.fromEntries(Object.values(groups).map((g) => [g.id, g.builtin["pt-BR"]]));

type Node = Record<string, unknown>;

/** Dot-paths of every leaf (string or message function). */
function leaves(node: Node, prefix = ""): string[] {
	return Object.entries(node).flatMap(([k, v]) => {
		const path = prefix ? `${prefix}.${k}` : k;
		return typeof v === "object" && v !== null ? leaves(v as Node, path) : [path];
	});
}

describe("i18n catalogs", () => {
	it("pt-BR has exactly the keys of en (deep)", () => {
		expect(leaves(ptBR).sort()).toEqual(leaves(en).sort());
	});

	it("leaf kinds match (string vs function) between locales", () => {
		const kind = (n: Node, path: string) =>
			typeof path.split(".").reduce<unknown>((o, k) => (o as Node)[k], n);
		for (const path of leaves(en)) {
			expect(kind(ptBR, path), path).toBe(kind(en, path));
		}
	});

	it("message functions return non-empty strings in both locales", () => {
		expect(groups.docs.en.search.empty("x")).toContain("x");
		expect(groups.docs.builtin["pt-BR"].search.empty("x")).toContain("x");
		expect(groups.appList.builtin["pt-BR"].selected(2)).toBe("2 selecionados");
		expect(groups.stepper.en.step(2, "Review", true)).toBe("Step 2: Review (done)");
	});
});
