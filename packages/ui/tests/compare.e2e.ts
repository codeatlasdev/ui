import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { join } from "node:path";
import { runCompare } from "../src/cli/compare.ts";

// #383: `compare` on two real pages. Page B differs from page A in one button's weight and padding;
// the report must name exactly those two properties of that element, and exit 1.

const page = (button: string) => `<!doctype html><meta charset="utf-8">
<style>body{margin:0;font:16px sans-serif}button{font:inherit;border:0;background:#2563eb;color:#fff;${button}}</style>
<button data-testid="save">Save</button><p data-testid="note">Hello</p>`;

const PAGES: Record<string, string> = {
	"/a": page("font-weight:400;padding:8px 12px"),
	"/b": page("font-weight:700;padding:8px 16px"),
	"/same": page("font-weight:400;padding:8px 12px"),
};

let server: ReturnType<typeof Bun.serve>;
let base = "";

beforeAll(() => {
	server = Bun.serve({
		port: 0,
		fetch: (req) => {
			const html = PAGES[new URL(req.url).pathname];
			return html
				? new Response(html, { headers: { "content-type": "text/html" } })
				: new Response("no", { status: 404 });
		},
	});
	base = `http://localhost:${server.port}`;
});
afterAll(() => server.stop(true));

const compare = async (a: string, b: string, tolerancePx?: number) => {
	const lines: string[] = [];
	const code = await runCompare(`${base}${a}`, `${base}${b}`, {
		viewports: [390],
		tolerancePx,
		cwd: join(import.meta.dir, ".."),
		log: (l) => lines.push(l),
	});
	return { code, out: lines.join("\n") };
};

describe("compare in Chromium", () => {
	it("two identical pages exit 0", async () => {
		const r = await compare("/a", "/same");
		expect(r.out).toContain("No differences.");
		expect(r.code).toBe(0);
	});

	it("a button that differs in weight and padding reports those and exits 1", async () => {
		const r = await compare("/a", "/b");
		expect(r.code).toBe(1);
		expect(r.out).toContain("[data-testid=save]");
		expect(r.out).toContain("fontWeight");
		expect(r.out).toContain("paddingLeft");
		expect(r.out).toContain("paddingRight");
		// The untouched paragraph is not in the table.
		expect(r.out).not.toContain("[data-testid=note]");
	});
});
