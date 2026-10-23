import { describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { importTokens, parseColor, runTokensImport, SHADCN_MAP } from "../src/cli/tokens-import.ts";
import { defineTheme } from "../src/lib/theme/define.ts";

/** Three themes, as a real design system writes them: dark app, dark public, light paper. */
const CSS = `
:root, [data-theme="app"] {
  --background: oklch(0.18 0.01 260);
  --foreground: oklch(0.96 0.005 260);
  --card: oklch(0.22 0.012 260);
  --muted-foreground: oklch(0.96 0.005 260 / 0.6);
  --border: oklch(1 0 0 / 0.1);
  --primary: oklch(0.72 0.17 160);
  --primary-foreground: oklch(0.15 0.02 160);
  --destructive: oklch(0.65 0.22 25);
  --radius: 0.5rem;
}
[data-theme="public"] {
  --background: oklch(0.12 0.01 280);
  --foreground: oklch(0.98 0 0);
  --card: oklch(0.16 0.01 280);
  --muted-foreground: oklch(0.98 0 0 / 0.35);
  --border: oklch(1 0 0 / 0.08);
  --primary: oklch(0.7 0.18 300);
  --primary-foreground: oklch(0.98 0 0);
}
[data-theme="paper"] {
  --background: #faf7f0;
  --foreground: oklch(0.2 0.02 80);
  --card: #ffffff;
  --muted-foreground: oklch(0.2 0.02 80 / 0.55);
  --border: oklch(0 0 0 / 0.12);
  --primary: #b45309;
  --primary-foreground: #ffffff;
}
`;

const MAP = {
	background: "--background",
	text: "--foreground",
	surface: "--card",
	textSecondary: "--muted-foreground",
	border: "--border",
	brandFill: "--primary",
	brandContrast: "--primary-foreground",
	error: "--destructive",
};

describe("parseColor", () => {
	it("reads hex, rgb(), hsl() and oklch(), with alpha", () => {
		expect(parseColor("#fff")).toMatchObject({ hex: "#ffffff", alpha: 1 });
		expect(parseColor("#11223380")?.alpha).toBeCloseTo(0.502, 2);
		expect(parseColor("rgb(255 0 0 / 50%)")).toMatchObject({ hex: "#ff0000", alpha: 0.5 });
		expect(parseColor("rgba(0, 0, 255, .25)")).toMatchObject({ hex: "#0000ff", alpha: 0.25 });
		expect(parseColor("hsl(120 100% 25% / 0.4)")).toMatchObject({ hex: "#008000", alpha: 0.4 });
		expect(parseColor("oklch(0.7 0.18 300 / 0.35)")?.alpha).toBe(0.35);
		expect(parseColor("oklch(1 0 0)")?.hex).toBe("#ffffff");
	});

	it("returns null for what it cannot read, instead of guessing", () => {
		expect(parseColor("var(--x)")).toBeNull();
		expect(parseColor("color-mix(in oklab, red, blue)")).toBeNull();
		expect(parseColor("transparent")).toBeNull();
	});
});

describe("importTokens: three themes with alpha", () => {
	const result = importTokens(CSS, { map: MAP });

	it("finds the three themes by their selectors, one preset each", () => {
		expect(result.themes.map((t) => t.name)).toEqual(["app", "public", "paper"]);
	});

	it("flattens alpha over the theme's own background and says so, per token", () => {
		const flat = result.flattened.filter((f) => f.theme === "app");
		expect(flat.map((f) => f.role).sort()).toEqual(["border", "textSecondary"]);
		const secondary = flat.find((f) => f.role === "textSecondary");
		expect(secondary?.alpha).toBe(0.6);
		expect(secondary?.over).toBe("background");
		expect(secondary?.hex).toMatch(/^#[0-9a-f]{6}$/);
		// 60% light text over a dark background is darker than the text itself, lighter than the page.
		const colors = result.themes[0].colors;
		expect(colors.textSecondary).toBe(secondary?.hex as string);
		expect(colors.textSecondary).not.toBe(colors.text);
	});

	it("an opaque token is carried as-is, converted to #rrggbb", () => {
		const paper = result.themes.find((t) => t.name === "paper");
		expect(paper?.colors.background).toBe("#faf7f0");
		expect(paper?.colors.brandFill).toBe("#b45309");
	});

	it("reports every pair under 4.5:1 and 3:1 for outlines, from the flattened colors", () => {
		const low = result.contrast.filter((c) => !c.pass);
		expect(low.length).toBeGreaterThan(0);
		const pub = low.find((c) => c.theme === "public" && c.pair === "textSecondary on background");
		expect(pub?.ratio).toBeLessThan(4.5);
		expect(pub?.min).toBe(4.5);
		const border = result.contrast.find(
			(c) => c.theme === "app" && c.pair === "border on background"
		);
		expect(border?.min).toBe(3);
		for (const c of result.contrast) expect(c.pass).toBe(c.ratio >= c.min);
	});

	it("emits a typed theme.ts that defineTheme accepts, with the first theme as the default preset", () => {
		expect(result.source).toContain('import type { ThemeOptions } from "@codeatlasdev/ui/vite";');
		expect(result.source).toContain("export const theme: ThemeOptions");
		expect(result.source).toContain('id: "app"');
		expect(result.source).toContain('defaultPreset: "app"');
		const dir = mkdtempSync(join(tmpdir(), "ca-tok-"));
		writeFileSync(
			join(dir, "theme.mjs"),
			result.source.replace(/^import type.*\n/m, "").replace(": ThemeOptions", "")
		);
		return import(join(dir, "theme.mjs")).then(({ theme }) => {
			const resolved = defineTheme(theme);
			expect(resolved.known).toContain("app");
			expect(resolved.known).toContain("paper");
		});
	});

	it("maps the radius custom property to the radius multiplier", () => {
		expect(result.source).toMatch(/radius: 0\.\d+/);
	});
});

describe("importTokens: input formats and gaps", () => {
	it("reads a tokens.json of { theme: { token: color } }", () => {
		const json = JSON.stringify({
			light: { bg: "#ffffff", fg: "#111111", brand: "#2563eb" },
			dark: { bg: "#0b0b0b", fg: "#f5f5f5", brand: "#60a5fa" },
		});
		const r = importTokens(json, {
			map: { background: "bg", text: "fg", brandFill: "brand" },
			format: "json",
		});
		expect(r.themes.map((t) => t.name)).toEqual(["light", "dark"]);
		expect(r.themes[1].colors.text).toBe("#f5f5f5");
	});

	it("lists a role it could not find in the source, instead of inventing a value", () => {
		const r = importTokens(`:root { --bg: #fff; }`, {
			map: { background: "--bg", text: "--missing" },
		});
		expect(r.missing).toEqual([{ theme: "root", role: "text", token: "--missing" }]);
		expect(r.themes[0].colors.text).toBeUndefined();
	});

	it("lists a value it cannot read (var(), color-mix) as unresolved", () => {
		const r = importTokens(`:root { --bg: #fff; --fg: var(--bg); }`, {
			map: { background: "--bg", text: "--fg" },
		});
		expect(r.unresolved).toEqual([
			{ theme: "root", role: "text", token: "--fg", value: "var(--bg)" },
		]);
	});

	it("a translucent token with no background in that theme is reported, not flattened over a guess", () => {
		const r = importTokens(`:root { --fg: oklch(1 0 0 / 0.5); }`, { map: { text: "--fg" } });
		expect(r.unresolved.map((u) => u.role)).toEqual(["text"]);
	});
});

describe("runTokensImport (CLI)", () => {
	const setup = () => {
		const dir = mkdtempSync(join(tmpdir(), "ca-tok-cli-"));
		mkdirSync(join(dir, "src"), { recursive: true });
		writeFileSync(join(dir, "tokens.css"), CSS);
		writeFileSync(join(dir, "map.json"), JSON.stringify(MAP));
		return dir;
	};

	it("writes --out and prints the flattened tokens and the pairs under the threshold; exit 0", () => {
		const dir = setup();
		const lines: string[] = [];
		const code = runTokensImport(join(dir, "tokens.css"), {
			map: join(dir, "map.json"),
			out: join(dir, "src/theme.ts"),
			cwd: dir,
			log: (l) => lines.push(l),
		});
		const out = lines.join("\n");
		expect(code).toBe(0);
		expect(readFileSync(join(dir, "src/theme.ts"), "utf8")).toContain("export const theme");
		expect(out).toContain("flattened app textSecondary");
		expect(out).toContain("below 4.5:1");
		expect(out).toContain("public textSecondary on background");
	});

	it("--strict exits 1 while a pair is under the threshold", () => {
		const dir = setup();
		const code = runTokensImport(join(dir, "tokens.css"), {
			map: join(dir, "map.json"),
			cwd: dir,
			strict: true,
			log: () => {},
		});
		expect(code).toBe(1);
	});

	it("without a map it uses the shadcn token names and says which roles it found", () => {
		const dir = setup();
		const lines: string[] = [];
		runTokensImport(join(dir, "tokens.css"), { cwd: dir, log: (l) => lines.push(l) });
		expect(lines.join("\n")).toContain("shadcn");
	});

	it("does not overwrite --out without --force", () => {
		const dir = setup();
		writeFileSync(join(dir, "src/theme.ts"), "mine");
		const code = runTokensImport(join(dir, "tokens.css"), {
			map: join(dir, "map.json"),
			out: join(dir, "src/theme.ts"),
			cwd: dir,
			log: () => {},
		});
		expect(code).toBe(1);
		expect(readFileSync(join(dir, "src/theme.ts"), "utf8")).toBe("mine");
	});
});

describe("importer roles match the theme engine", () => {
	const src = readFileSync(join(import.meta.dir, "../src/lib/theme/define.ts"), "utf8");
	const roles = new Set(
		[
			...src
				.slice(src.indexOf("export interface SchemeColors"), src.indexOf("const ROLE_TOKENS"))
				.matchAll(/^\t(\w+)\??:/gm),
		].map((m) => m[1])
	);

	it("every role the shadcn map fills is a SchemeColors key", () => {
		expect(roles.has("textSecondary")).toBe(true);
		expect(Object.keys(SHADCN_MAP).filter((r) => !roles.has(r))).toEqual([]);
	});

	it("the generated theme.ts only pins roles the engine knows", () => {
		const r = importTokens(CSS, { map: MAP });
		for (const t of r.themes)
			expect(Object.keys(t.colors).filter((k) => !roles.has(k))).toEqual([]);
	});
});
