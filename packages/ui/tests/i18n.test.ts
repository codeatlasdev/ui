import { describe, expect, it } from "bun:test";
import { en } from "../src/lib/i18n/en.js";
import { ptBR } from "../src/lib/i18n/pt-BR.js";

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
		expect(leaves(ptBR as unknown as Node).sort()).toEqual(leaves(en as unknown as Node).sort());
	});

	it("leaf kinds match (string vs function) between locales", () => {
		const kind = (n: Node, path: string) =>
			typeof path.split(".").reduce<unknown>((o, k) => (o as Node)[k], n);
		for (const path of leaves(en as unknown as Node)) {
			expect(kind(ptBR as unknown as Node, path), path).toBe(kind(en as unknown as Node, path));
		}
	});

	it("message functions return non-empty strings in both locales", () => {
		expect(en.docs.search.empty("x")).toContain("x");
		expect(ptBR.docs.search.empty("x")).toContain("x");
		expect(ptBR.appList.selected(2)).toBe("2 selecionados");
		expect(en.stepper.step(2, "Review", true)).toBe("Step 2: Review (done)");
	});
});
