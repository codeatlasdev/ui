import { describe, expect, it } from "bun:test";
import { toCsv, toJson } from "../src/lib/utils/export.js";

describe("toCsv", () => {
	it("infers columns from the first row and quotes per RFC 4180", () => {
		const csv = toCsv([
			{ name: 'Ana "A"', note: "a,b", multi: "l1\nl2" },
			{ name: "Bo", note: "", multi: "x" },
		]);
		expect(csv).toBe('name,note,multi\r\n"Ana ""A""","a,b","l1\nl2"\r\nBo,,x\r\n');
	});

	it("honours explicit columns (order, header label, value getter)", () => {
		const csv = toCsv(
			[{ domain: "a.com", price: 12 }],
			[
				{ key: "price", header: "Price (USD)" },
				{ key: "domain", header: "Domain", value: (r) => r.domain.toUpperCase() },
			]
		);
		expect(csv).toBe("Price (USD),Domain\r\n12,A.COM\r\n");
	});

	it("neutralises spreadsheet formulas (CSV injection)", () => {
		const csv = toCsv([{ a: "=HYPERLINK(1)", b: "+1", c: "-2", d: "@SUM", e: "ok" }]);
		expect(csv).toBe("a,b,c,d,e\r\n'=HYPERLINK(1),'+1,'-2,'@SUM,ok\r\n");
	});

	it("keeps real negative numbers as numbers", () => {
		expect(toCsv([{ n: -2.5 }])).toBe("n\r\n-2.5\r\n");
	});

	it("serialises null/undefined as empty and booleans/dates as text", () => {
		const csv = toCsv([{ a: null, b: undefined, c: true, d: new Date("2026-01-02T03:04:05Z") }]);
		expect(csv).toBe("a,b,c,d\r\n,,true,2026-01-02T03:04:05.000Z\r\n");
	});

	it("emits only the header for no rows when columns are given", () => {
		expect(toCsv([], [{ key: "a" }])).toBe("a\r\n");
	});
});

describe("toJson", () => {
	it("pretty-prints the rows, restricted to the given columns", () => {
		expect(toJson([{ a: 1, b: 2 }], [{ key: "a" }])).toBe('[\n  {\n    "a": 1\n  }\n]');
	});
	it("returns all fields without columns", () => {
		expect(JSON.parse(toJson([{ a: 1, b: 2 }]))).toEqual([{ a: 1, b: 2 }]);
	});
});
