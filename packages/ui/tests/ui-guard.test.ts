import { afterAll, describe, expect, it } from "bun:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { GUARD_RULES, guardSource, runGuard } from "../src/cli/ui-guard.ts";
import { cleanTmp, tmpDir } from "./tmp";

afterAll(cleanTmp);

const rules = (file: string, src: string, allow: string[] = []) =>
	guardSource(file, src, { allow }).map((v) => `${v.rule}:${v.line}`);

describe("ui guard: styles", () => {
	it("flags a hex color in a style block and in a .css file, with the line", () => {
		expect(rules("A.svelte", "<p>x</p>\n<style>\n  .a { color: #ff0000; }\n</style>")).toEqual([
			"hex:3",
		]);
		expect(rules("app.css", ".a {\n  background: #fff;\n}")).toEqual(["hex:2"]);
	});

	it("flags a raw px size but not 0px, 1px hairlines, media queries or a token fallback", () => {
		expect(rules("app.css", ".a { padding: 12px; }")).toEqual(["px:1"]);
		expect(
			rules("app.css", ".a { border: 1px solid var(--ca-outline-default); margin: 0px; }")
		).toEqual([]);
		expect(rules("app.css", "@media (min-width: 900px) { .a { color: red } }")).toEqual([]);
		expect(rules("app.css", ".a { padding: var(--ca-space-3, 12px); }")).toEqual([]);
	});

	it("flags an inline style attribute that sets anything but a custom property", () => {
		expect(rules("A.svelte", '<div style="padding: 20px">x</div>')).toEqual(["inline-style:1"]);
		expect(rules("A.svelte", '<div style="--bar-w:{pct}%">x</div>')).toEqual([]);
	});

	it("flags :global(.ca-*) outside the allow-list and accepts it inside", () => {
		const src = "<style>\n:global(.ca-btn) { height: var(--ca-space-10); }\n</style>";
		expect(rules("A.svelte", src)).toEqual(["global-ca:2"]);
		expect(
			rules("src/lib/overrides.css", ":global(.ca-btn) { height: var(--ca-space-10); }", [
				"src/lib/overrides.css",
			])
		).toEqual([]);
	});

	it("a ca-ui-workaround marker on the line or above excuses any rule", () => {
		expect(
			rules("app.css", "/* ca-ui-workaround(#12): no token for this */\n.a { color: #123456; }")
		).toEqual([]);
	});

	it("a pending marker (no issue yet) excuses the rule like a numbered one (#1081)", () => {
		expect(
			rules("app.css", "/* ca-ui-workaround(pending: no token for this) */\n.a { color: #123456; }")
		).toEqual([]);
		expect(
			rules("app.css", ".a { color: #123456; } /* ca-ui-workaround(pendente: sem token) */")
		).toEqual([]);
		expect(rules("app.css", "/* ca-ui-workaround(soon) */\n.a { color: #123456; }")).toEqual([
			"hex:2",
		]);
	});

	it("ignores comments", () => {
		expect(
			rules("app.css", "/* color: #fff; padding: 12px */\n.a { color: var(--ca-text-primary); }")
		).toEqual([]);
	});
});

describe("ui guard: strings in markup", () => {
	it("flags visible text written in a .svelte template, not text from a function", () => {
		expect(rules("A.svelte", "<h1>Welcome back</h1>")).toEqual(["i18n-literal:1"]);
		expect(rules("A.svelte", "<h1>{t.welcome}</h1>")).toEqual([]);
		expect(rules("A.svelte", '<Button label="Save changes" />')).toEqual(["i18n-literal:1"]);
		expect(rules("A.svelte", "<Button label={t.save} />")).toEqual([]);
	});

	it("ignores code, numbers, symbols and attributes that are not text", () => {
		expect(
			rules(
				"A.svelte",
				'<script>const a = "Hello there";</script>\n<div class="a b" id="x" data-x="Some text">{n}</div>'
			)
		).toEqual([]);
		expect(rules("A.svelte", "<span>12</span><span>—</span>")).toEqual([]);
	});

	it("reads only .svelte and .astro for text", () => {
		expect(rules("a.ts", "const s = '<h1>Welcome back</h1>';")).toEqual([]);
	});
});

describe("ui guard: forbidden terms (#1156)", () => {
	const terms = [{ term: "Cliente", use: "Contato" }, "Usuário", "Fale conosco"];
	const found = (src: string, forbiddenTerms: unknown[] = terms) =>
		guardSource("A.svelte", src, {
			forbiddenTerms,
			rules: ["forbidden-term"],
		} as Parameters<typeof guardSource>[2]).map((v) => `${v.rule}:${v.line} ${v.message}`);

	it("flags a configured term in template text and text attributes, with the line", () => {
		const src =
			'<script>\n  import { TextField } from "@codeatlasdev/ui";\n</script>\n<h1>Novo cliente</h1>\n<TextField label="Nome do usuário" />';
		const out = found(src);
		expect(out.map((o) => o.split(" ")[0])).toEqual(["forbidden-term:4", "forbidden-term:5"]);
		expect(out[0]).toContain('"cliente"');
		expect(out[0]).toContain('"Contato"');
		expect(out[1]).toContain('"usuário"');
	});

	it("matches whole words in any case, a phrase across a line break", () => {
		expect(found("<p>Clientela e clientes</p>")).toEqual([]);
		expect(found("<p>CLIENTE</p>").map((o) => o.split(" ")[0])).toEqual(["forbidden-term:1"]);
		expect(found("<p>\n  Bem-vindo,\n  cliente\n</p>").map((o) => o.split(" ")[0])).toEqual([
			"forbidden-term:3",
		]);
		expect(found("<p>Fale\n  conosco</p>").map((o) => o.split(" ")[0])).toEqual([
			"forbidden-term:1",
		]);
	});

	it("caseSensitive matches only the case written in the config", () => {
		const exact = [{ term: "Cliente", caseSensitive: true }];
		expect(found("<p>cliente</p>", exact)).toEqual([]);
		expect(found("<p>Cliente</p>", exact).length).toBe(1);
	});

	it("comments, script, style, expressions and non-text attributes are not copy", () => {
		const src = [
			"<script>",
			"  // Cliente",
			'  const cliente = { nome: "Cliente" };',
			"</script>",
			"<!-- Cliente -->",
			'<div class="cliente" data-role="Cliente" title={cliente.nome}>{cliente.nome}</div>',
			"<style>",
			"  /* Cliente */",
			"  .cliente { color: var(--ca-text-primary); }",
			"</style>",
		].join("\n");
		expect(found(src)).toEqual([]);
	});

	it("a ca-ui-workaround marker on the line or above excuses it", () => {
		expect(found("<!-- ca-ui-workaround(pending: legal name) -->\n<p>Cliente</p>")).toEqual([]);
	});

	it("runGuard prints file:line for a term from the options", () => {
		const dir = tmpDir("ca-guard-terms-");
		mkdirSync(join(dir, "src/routes"), { recursive: true });
		writeFileSync(join(dir, "src/routes/+page.svelte"), "<h1>Lista</h1>\n<p>Cliente novo</p>\n");
		const lines: string[] = [];
		const options = { cwd: dir, forbiddenTerms: terms, log: (l: string) => lines.push(l) };
		expect(runGuard(["src"], options as Parameters<typeof runGuard>[1])).toBe(1);
		expect(lines.join("\n")).toContain("src/routes/+page.svelte:2 forbidden-term");
	});
});

describe("runGuard", () => {
	const setup = (files: Record<string, string>) => {
		const dir = tmpDir("ca-guard-");
		for (const [p, c] of Object.entries(files)) {
			mkdirSync(dirname(join(dir, p)), { recursive: true });
			writeFileSync(join(dir, p), c);
		}
		return dir;
	};

	it("prints file:line rule message and exits 1 when something is flagged", () => {
		const dir = setup({ "src/a.css": ".a { color: #f00 }\n" });
		const lines: string[] = [];
		expect(runGuard(["src"], { cwd: dir, log: (l) => lines.push(l) })).toBe(1);
		expect(lines.join("\n")).toContain("src/a.css:1 hex");
	});

	it("exits 0 on a clean tree and skips node_modules", () => {
		const dir = setup({
			"src/a.css": ".a { color: var(--ca-text-primary) }\n",
			"src/node_modules/x/b.css": ".a { color: #fff }\n",
		});
		expect(runGuard(["src"], { cwd: dir, log: () => {} })).toBe(0);
	});

	it("takes the allow-list from the options", () => {
		const dir = setup({ "src/o.css": ":global(.ca-btn) { height: var(--ca-space-10) }\n" });
		expect(runGuard(["src"], { cwd: dir, allow: ["src/o.css"], log: () => {} })).toBe(0);
		expect(runGuard(["src"], { cwd: dir, log: () => {} })).toBe(1);
	});
});

describe("ui guard: layout rules (#920)", () => {
	it("layout-css: spacing in rem/em off the scale, not a token or 0", () => {
		expect(rules("app.css", ".a { padding: 1.3rem 0.5em; }")).toEqual(["layout-css:1"]);
		expect(rules("app.css", ".a { gap: var(--ca-space-4); margin: 0; padding: auto; }")).toEqual(
			[]
		);
		expect(rules("app.css", ".a { width: 2rem; }")).toEqual([]);
	});

	it("layout-css: a property that only contains the word is not spacing", () => {
		expect(rules("app.css", ".a { --card-padding: 1.5rem; }")).toEqual([]);
		expect(rules("app.css", ".a { scroll-margin-top: 4rem; }")).toEqual([]);
		expect(rules("app.css", ".a { scroll-padding: 2rem; }")).toEqual([]);
		expect(rules("app.css", ".a { margin-top: 4rem; }")).toEqual(["layout-css:1"]);
		expect(rules("app.css", ".a { padding-inline: 1.3rem; }")).toEqual(["layout-css:1"]);
	});

	it("breakpoint: a media width off the 600/900/1200/1536 scale", () => {
		expect(rules("app.css", "@media (max-width: 768px) { .a { color: red } }")).toEqual([
			"breakpoint:1",
		]);
		expect(
			rules(
				"app.css",
				"@media (max-width: 899.98px) { .a {} } @media (min-width: 1536px) { .b {} }"
			)
		).toEqual([]);
		// A container query answers the component's own width: any threshold is fine.
		expect(rules("app.css", "@container (min-width: 37rem) { .a {} }")).toEqual([]);
	});

	it("breakpoint: every width condition of one query is checked, not only the first", () => {
		const out = rules("app.css", "@media (min-width: 600px) and (max-width: 900px) { .a {} }");
		expect(out).toEqual(["breakpoint:1"]);
		expect(
			rules("app.css", "@media (min-width: 600px) and (max-width: 899.98px) { .a {} }")
		).toEqual([]);
		expect(rules("app.css", "@media (min-width: 700px) and (max-width: 1000px) { .a {} }")).toEqual(
			["breakpoint:1", "breakpoint:1"]
		);
	});

	it("vh-offset: a magic offset subtracted from the viewport height", () => {
		expect(rules("app.css", ".a { height: calc(var(--ca-vh) - 17rem); }")).toEqual(["vh-offset:1"]);
		expect(
			rules("app.css", ".a { height: calc(var(--ca-vh) - var(--ca-shell-inset-bottom)); }")
		).toEqual([]);
	});

	it("fixed-width-row: a growing nowrap item that cannot shrink", () => {
		expect(rules("app.css", ".t { flex: 1; white-space: nowrap; }")).toEqual(["fixed-width-row:1"]);
		expect(
			rules("app.css", ".t { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; }")
		).toEqual([]);
		expect(rules("app.css", ".t { white-space: nowrap; }")).toEqual([]);
	});

	it("fixed-width-row: overflow hidden, auto or scroll already lets the item shrink", () => {
		for (const o of ["hidden", "auto", "scroll"])
			expect(
				rules(
					"app.css",
					`.t { flex: 1; white-space: nowrap; overflow: ${o}; text-overflow: ellipsis; }`
				)
			).toEqual([]);
		expect(rules("app.css", ".t { flex: 1; white-space: nowrap; overflow: visible; }")).toEqual([
			"fixed-width-row:1",
		]);
	});

	it("nested-surface: a Card or Surface directly inside another", () => {
		const nested =
			'<script>import { Card } from "@codeatlasdev/ui";</script>\n<Card>\n  <Card>x</Card>\n</Card>';
		expect(rules("A.svelte", nested).filter((r) => r.startsWith("nested-surface"))).toEqual([
			"nested-surface:3",
		]);
		const ok = "<Card>\n  <section><p>{t.a}</p></section>\n</Card>";
		expect(rules("A.svelte", ok).filter((r) => r.startsWith("nested-surface"))).toEqual([]);
	});

	it("nested-surface: sibling self-closing surfaces are not nesting", () => {
		const siblings = "<Card skeleton />\n<Card skeleton />";
		expect(rules("A.svelte", siblings)).toEqual([]);
		const inner = "<Card>\n  <Card skeleton />\n</Card>";
		expect(rules("A.svelte", inner)).toEqual(["nested-surface:2"]);
	});

	it("nested-surface: an arrow function in an attribute does not hide real nesting", () => {
		const src = "<Card onclick={() => go()}>\n  <Card>x</Card>\n</Card>";
		expect(rules("A.svelte", src)).toEqual(["nested-surface:2"]);
	});

	it("nested-surface: .astro markup gets the same two cases", () => {
		expect(rules("A.astro", "<Card skeleton />\n<Card skeleton />")).toEqual([]);
		expect(rules("A.astro", "<Card onclick={() => go()}>\n  <Card>x</Card>\n</Card>")).toEqual([
			"nested-surface:2",
		]);
	});

	it("rules can be chosen", () => {
		const src = ".a { padding: 1.3rem; height: calc(var(--ca-vh) - 2rem); }";
		expect(guardSource("app.css", src, { rules: ["vh-offset"] }).map((v) => v.rule)).toEqual([
			"vh-offset",
		]);
	});
});

describe("ui guard: breakpoint convention (#916)", () => {
	it("max-width is the scale minus 0.02px, min-width the full value", () => {
		const out = guardSource(
			"app.css",
			"@media (max-width: 900px) { .a {} }\n@media (max-width: 1100px) { .b {} }"
		);
		expect(out.map((v) => `${v.rule}:${v.line}`)).toEqual(["breakpoint:1", "breakpoint:2"]);
		expect(out[0]?.message).toContain("899.98px");
		expect(
			rules("app.css", "@media (max-width: 899.98px) { .a {} } @media (min-width: 900px) { .b {} }")
		).toEqual([]);
		expect(rules("app.css", "@media (min-width: 899.98px) { .a {} }")).toEqual(["breakpoint:1"]);
	});
});

const bin = join(import.meta.dir, "../bin/codeatlas-ui.ts");

describe("codeatlas-ui lint --rules (#920)", () => {
	const lint = (...args: string[]) => {
		const r = Bun.spawnSync(["bun", bin, "lint", ...args], { cwd: tmpDir("ca-guard-cli-") });
		return { code: r.exitCode, out: r.stdout.toString(), err: r.stderr.toString() };
	};

	it("a bare --rules lists every rule and exits 0", () => {
		const r = lint("--rules");
		expect(r.code).toBe(0);
		for (const rule of GUARD_RULES) expect(r.out).toContain(rule);
	});

	it("an unknown rule exits 2 and names it", () => {
		const r = lint("--rules", "hex,nope");
		expect(r.code).toBe(2);
		expect(r.err).toContain("unknown rule: nope");
	});

	it("lists forbidden-term (#1156)", () => {
		expect(lint("--rules").out).toContain("forbidden-term");
	});
});

describe("codeatlas-ui lint: forbiddenTerms config (#1156)", () => {
	const lintIn = (files: Record<string, string>, ...args: string[]) => {
		const dir = tmpDir("ca-guard-cli-");
		for (const [p, c] of Object.entries(files)) {
			mkdirSync(dirname(join(dir, p)), { recursive: true });
			writeFileSync(join(dir, p), c);
		}
		const r = Bun.spawnSync(["bun", bin, "lint", ...args], { cwd: dir });
		return { code: r.exitCode, out: r.stdout.toString(), err: r.stderr.toString() };
	};

	it("reads the terms from ui-guard.config.json", () => {
		const r = lintIn(
			{
				"ui-guard.config.json": JSON.stringify({
					allow: [],
					forbiddenTerms: [{ term: "Cliente", use: "Contato" }],
				}),
				"src/a.svelte": "<h1>Lista</h1>\n<p>Novo cliente</p>\n",
			},
			"--rules",
			"forbidden-term"
		);
		expect(r.code).toBe(1);
		expect(r.out).toContain("src/a.svelte:2 forbidden-term");
		expect(r.out).toContain('"Contato"');
	});

	it("a malformed forbiddenTerms entry exits 2 and names it", () => {
		const r = lintIn({
			"ui-guard.config.json": JSON.stringify({ forbiddenTerms: ["Cliente", { word: "x" }] }),
			"src/a.svelte": "<p>{m.x}</p>\n",
		});
		expect(r.code).toBe(2);
		expect(r.err).toContain("forbiddenTerms[1]");
	});
});
