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

describe("ui guard: hard navigation (#1155)", () => {
	const nav = (file: string, src: string, reloadRoutes?: string[]) =>
		guardSource(file, src, { reloadRoutes, rules: ["hard-navigation"] }).map(
			(v) => `${v.rule}:${v.line}`
		);

	it("flags href, assign, replace and location to an internal path", () => {
		const src = [
			"export function go(id: string) {",
			'  location.href = "/orders";',
			"  window.location.href = '/x';",
			`  location.assign(\`/orders/\${id}\`);`,
			'  window.location.replace("../login?next=/");',
			"  document.location = '/y';",
			'  location = "?page=2";',
			"}",
		].join("\n");
		expect(nav("src/lib/nav.ts", src)).toEqual(
			[2, 3, 4, 5, 6, 7].map((l) => `hard-navigation:${l}`)
		);
	});

	it("flags it in a .svelte script and an event handler", () => {
		const src = [
			'<script lang="ts">',
			'  const out = () => { location.href = "/dashboard"; };',
			"</script>",
			'<button onclick={() => (window.location.href = "/x")}>{m.go}</button>',
		].join("\n");
		expect(nav("A.svelte", src)).toEqual(["hard-navigation:2", "hard-navigation:4"]);
	});

	it("names the path and the fix in the message", () => {
		const [v] = guardSource("a.ts", 'location.href = "/orders";', { rules: ["hard-navigation"] });
		expect(v?.message).toContain('"/orders"');
		expect(v?.message).toContain("goto()");
		expect(v?.message).toContain("reloadRoutes");
	});

	it("base from $app/paths is still the app's own origin", () => {
		expect(nav("a.ts", `location.href = \`\${base}/orders\`;`)).toEqual(["hard-navigation:1"]);
	});

	it("external URLs, hashes and unknown targets are not flagged", () => {
		const src = [
			'location.href = "https://example.com/x";',
			'location.assign("mailto:a@b.co");',
			'window.location.href = "//cdn.example.com/x";',
			'location.href = "#top";',
			"location.replace(url);",
			`location.href = \`\${apiOrigin}/x\`;`,
			'<a href="/orders">{m.orders}</a>',
		].join("\n");
		expect(nav("A.svelte", src)).toEqual([]);
	});

	it("reads, comparisons, comments and locals are not navigation", () => {
		const src = [
			'if (location.href === "/x") go();',
			"const here = location.pathname;",
			'// location.href = "/x";',
			'/* location.assign("/x") */',
			'let location = "/x";',
			'let { location = "/x", b } = $props();',
			'url.location = "/x";',
		].join("\n");
		expect(nav("a.ts", src)).toEqual([]);
	});

	it("reloadRoutes allows exact routes and /prefix/* globs", () => {
		const src = [
			'location.href = "/logout";',
			'location.href = "/logout?next=/";',
			'location.assign("/auth/callback");',
			'location.href = "/orders";',
		].join("\n");
		expect(nav("a.ts", src, ["/logout", "/auth/*"])).toEqual(["hard-navigation:4"]);
	});

	it("a ca-ui-workaround marker on the line or above excuses it", () => {
		const src = '// ca-ui-workaround(pending: SSO must reload)\nlocation.href = "/sso";';
		expect(nav("a.ts", src)).toEqual([]);
	});

	it("runGuard reads .ts for this rule only and skips test files", () => {
		const dir = tmpDir("ca-guard-nav-");
		const files = {
			"src/lib/nav.ts": 'export const go = () => {\n  location.href = "/x";\n};\n',
			"src/lib/css.ts": 'export const css = "<style>.a { color: #fff; }</style>";\n',
			"src/lib/nav.test.ts": 'location.href = "/x";\n',
		};
		for (const [p, c] of Object.entries(files)) {
			mkdirSync(dirname(join(dir, p)), { recursive: true });
			writeFileSync(join(dir, p), c);
		}
		const lines: string[] = [];
		expect(runGuard(["src"], { cwd: dir, log: (l) => lines.push(l) })).toBe(1);
		expect(lines.filter((l) => l.startsWith("src/"))).toEqual([
			expect.stringContaining("src/lib/nav.ts:2 hard-navigation"),
		]);
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

describe("ui guard: mobile rules (#1154)", () => {
	const MOBILE = ["viewport-unit", "fixed-bottom-offset", "safe-area-bottom"] as const;
	type Rules = NonNullable<Parameters<typeof guardSource>[2]>["rules"];
	const mobile = (file: string, src: string, only: readonly string[] = MOBILE) =>
		guardSource(file, src, { rules: only as Rules }).map((v) => `${v.rule}:${v.line}`);

	it("viewport-unit: a height in 100vh, dvh, svh or lvh", () => {
		const src = [
			".a { height: 100vh; }",
			".b { min-height: 100dvh; }",
			".c { max-height: calc(100svh - var(--ca-space-4)); }",
			".d { block-size: 100lvh; }",
		].join("\n");
		expect(mobile("app.css", src)).toEqual([1, 2, 3, 4].map((l) => `viewport-unit:${l}`));
	});

	it("viewport-unit: a .svelte style block, with the token named", () => {
		const src = "<div>{x}</div>\n<style>\n  .page { min-height: 100vh; }\n</style>";
		const out = guardSource("A.svelte", src, { rules: MOBILE as Rules });
		expect(out.map((v) => `${v.rule}:${v.line}`)).toEqual(["viewport-unit:3"]);
		expect(out[0]?.message).toContain("var(--ca-vh)");
	});

	it("viewport-unit: the token, its fallback and @supports are fine", () => {
		const src = [
			".a { height: var(--ca-vh); min-height: var(--ca-vh-min); }",
			".b { height: var(--ca-vh, 100vh); }",
			"@supports (height: 100dvh) { .c { height: var(--ca-vh); } }",
		].join("\n");
		expect(mobile("app.css", src)).toEqual([]);
	});

	it("fixed-bottom-offset: a fixed box with a literal bottom", () => {
		const src = [
			".fab { position: fixed; bottom: 64px; right: var(--ca-space-4); }",
			".bar {\n  position: fixed;\n  inset-block-end: 4.5rem;\n}",
			".pill { position: fixed; inset: auto var(--ca-space-4) 72px; }",
		].join("\n");
		expect(mobile("app.css", src, ["fixed-bottom-offset"])).toEqual([
			"fixed-bottom-offset:1",
			"fixed-bottom-offset:4",
			"fixed-bottom-offset:6",
		]);
	});

	it("fixed-bottom-offset: a token offset or a box that is not fixed", () => {
		const src = [
			".a { position: fixed; bottom: calc(var(--ca-bottom-nav-h) + var(--ca-safe-bottom)); }",
			".b { position: fixed; bottom: var(--ca-space-4); }",
			".c { position: absolute; bottom: 64px; }",
			".d { position: fixed; bottom: max(16px, var(--ca-safe-bottom)); }",
		].join("\n");
		expect(mobile("app.css", src, ["fixed-bottom-offset"])).toEqual([]);
	});

	it("safe-area-bottom: a fixed bottom bar without the safe area", () => {
		const src = [
			".bar { position: fixed; left: 0; right: 0; bottom: 0; padding: var(--ca-space-3); }",
			".nav { position: fixed; inset-inline: 0; inset-block-end: 0; }",
			".dock { position: fixed; inset: auto 0 0; }",
		].join("\n");
		const out = guardSource("app.css", src, { rules: ["safe-area-bottom"] as Rules });
		expect(out.map((v) => `${v.rule}:${v.line}`)).toEqual(
			[1, 2, 3].map((l) => `safe-area-bottom:${l}`)
		);
		expect(out[0]?.message).toContain("var(--ca-safe-bottom)");
	});

	it("safe-area-bottom: the token, env() or a full-height box", () => {
		const src = [
			".a { position: fixed; bottom: 0; padding-bottom: var(--ca-safe-bottom); }",
			".b { position: fixed; bottom: 0; padding-block-end: env(safe-area-inset-bottom); }",
			".scrim { position: fixed; top: 0; right: 0; bottom: 0; left: 0; }",
			".overlay { position: fixed; inset: 0; }",
			".c { position: absolute; bottom: 0; }",
		].join("\n");
		expect(mobile("app.css", src, ["safe-area-bottom"])).toEqual([]);
	});

	it("a ca-ui-workaround marker on the line or above excuses them", () => {
		const src = "/* ca-ui-workaround(pending: kiosk build) */\n.a { height: 100vh; }";
		expect(mobile("app.css", src)).toEqual([]);
	});

	it("runGuard prints file:line for a component style block", () => {
		const dir = tmpDir("ca-guard-mobile-");
		mkdirSync(join(dir, "src/routes"), { recursive: true });
		const page = "<div>{m.x}</div>\n<style>\n  .bar { position: fixed; bottom: 0; }\n</style>\n";
		writeFileSync(join(dir, "src/routes/+page.svelte"), page);
		const lines: string[] = [];
		const options = { cwd: dir, rules: MOBILE as Rules, log: (l: string) => lines.push(l) };
		expect(runGuard(["src"], options)).toBe(1);
		expect(lines.join("\n")).toContain("src/routes/+page.svelte:3 safe-area-bottom");
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

	it("lists hard-navigation (#1155)", () => {
		expect(lint("--rules").out).toContain("hard-navigation");
	});

	it("lists the mobile rules (#1154)", () => {
		const out = lint("--rules").out;
		for (const rule of ["viewport-unit", "fixed-bottom-offset", "safe-area-bottom"])
			expect(out).toContain(rule);
	});
});

describe("codeatlas-ui lint: ui-guard.config.json", () => {
	const lintIn = (files: Record<string, string>, ...args: string[]) => {
		const dir = tmpDir("ca-guard-cli-");
		for (const [p, c] of Object.entries(files)) {
			mkdirSync(dirname(join(dir, p)), { recursive: true });
			writeFileSync(join(dir, p), c);
		}
		const r = Bun.spawnSync(["bun", bin, "lint", ...args], { cwd: dir });
		return { code: r.exitCode, out: r.stdout.toString(), err: r.stderr.toString() };
	};

	it("reads forbiddenTerms (#1156)", () => {
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

	it("reads reloadRoutes (#1155)", () => {
		const src = 'export const out = () => {\n  location.href = "/logout";\n};\n';
		const files = { "src/lib/auth.ts": src };
		const config = { "ui-guard.config.json": JSON.stringify({ reloadRoutes: ["/logout"] }) };
		const bare = lintIn(files, "--rules", "hard-navigation");
		expect(bare.code).toBe(1);
		expect(bare.out).toContain("src/lib/auth.ts:2 hard-navigation");
		expect(lintIn({ ...files, ...config }, "--rules", "hard-navigation").code).toBe(0);
	});

	it("a reloadRoutes entry that is not a path exits 2 (#1155)", () => {
		const r = lintIn({
			"ui-guard.config.json": JSON.stringify({ reloadRoutes: ["/logout", "logout"] }),
			"src/a.svelte": "<p>{m.x}</p>\n",
		});
		expect(r.code).toBe(2);
		expect(r.err).toContain("reloadRoutes[1]");
	});
});
