import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

/**
 * #417: the coarse-pointer hit-area lists in base.css are edited by many PRs. A merge once dropped a
 * comma, fusing `.glass-btn-clear .ca-tf__reveal` into a descendant selector, so the password
 * reveal button lost its 44px target. Each list must be plain class selectors, unique, and the
 * `position: relative` list must equal the `::after` overlay list.
 */
const css = readFileSync(new URL("../src/lib/styles/base.css", import.meta.url), "utf8");
const block = css.slice(css.indexOf("@media (pointer: coarse)"));
const lists = [...block.matchAll(/:where\(([^)]*)\)\s*(::after)?\s*\{/g)].slice(0, 2).map((m) =>
	m[1]
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean)
);

describe("touch hit-area lists (#417)", () => {
	it("has the position list and the ::after overlay list", () => {
		expect(lists).toHaveLength(2);
	});

	it("every entry is a single class selector, listed once", () => {
		for (const list of lists) {
			expect(list.filter((s) => !/^\.[a-z][\w-]*$/.test(s))).toEqual([]);
			expect(list.filter((s, i) => list.indexOf(s) !== i)).toEqual([]);
		}
	});

	it("both lists hold the same controls", () => {
		expect([...lists[0]].sort()).toEqual([...lists[1]].sort());
	});

	it("covers the password reveal button", () => {
		expect(lists[0]).toContain(".ca-tf__reveal");
	});
});
