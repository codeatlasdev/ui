// Guards the CSS rules that broke glass or layout in production before.
// Run: bun scripts/lint-tokens.ts   (exit 1 on any violation; wired into `validate`)
//
//   will-change      a file that uses backdrop-filter must not declare will-change:
//                    it promotes the layer and the blur captures transparent content.
//   viewport-unit    a literal 100vh/100dvh/100svh/100lvh must go through var(--ca-vh)
//                    (tokens.css defines the token; test harnesses are exempt).
//   backdrop-order   -webkit-backdrop-filter must come BEFORE backdrop-filter in a rule:
//                    Lightning CSS keeps only the prefixed one otherwise.
//   input-font-size  a literal font-size under 16px on an input/textarea/select rule
//                    makes iOS Safari zoom on focus.
//   svelte-ignore    `svelte-ignore` takes warning codes only; any prose after them is read
//                    as more codes and the real warning comes back (fails a11y builds).
//   breakpoint       width media queries use the one scale (600/900/1200/1536, max = N-0.02).
//   text-disabled    `color: var(--ca-text-disabled)` belongs to disabled controls only; de-emphasised
//                    information uses --ca-text-hint (prose.css list markers are decorative and allowed).
//   focus-ring       a focus rule must read var(--ca-focus-ring), not a literal --ca-brand-main.
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

export interface Violation {
	file: string;
	line: number;
	rule:
		| "will-change"
		| "viewport-unit"
		| "backdrop-order"
		| "input-font-size"
		| "svelte-ignore"
		| "breakpoint"
		| "text-disabled"
		| "focus-ring";
	message: string;
}

const COMMENT = /\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->/g;
const lineOf = (s: string, i: number) => s.slice(0, i).split("\n").length;

/** The regions of a file that hold CSS: the whole file, or the <style> blocks of a .svelte file. */
function cssRegions(file: string, src: string): { text: string; offset: number }[] {
	if (file.endsWith(".css")) return [{ text: src, offset: 0 }];
	const out: { text: string; offset: number }[] = [];
	for (const m of src.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g))
		out.push({ text: m[1] ?? "", offset: (m.index ?? 0) + m[0].indexOf(">") + 1 });
	return out;
}

const INPUT_SELECTOR =
	/(^|[\s,>+~(])(input|textarea|select)\b|\[contenteditable|-input\b|__input\b/;

/** Allowed width breakpoints (px) for min-width; max-width uses the same minus 0.02. */
const BREAKPOINTS = [600, 900, 1200, 1536];

/** Pure: lint one file's source. Test harnesses skip the viewport-unit and breakpoint rules. */
export function lintSource(file: string, source: string): Violation[] {
	const v: Violation[] = [];
	for (const m of source.matchAll(/(?:<!--|\/\/)\s*svelte-ignore\s+([^\n]*?)(?:-->|$)/gm)) {
		const codes = (m[1] ?? "").trim();
		if (!/^[a-z0-9_]+(?:\s*,?\s*[a-z0-9_]+)*$/.test(codes))
			v.push({
				file,
				line: lineOf(source, m.index ?? 0),
				rule: "svelte-ignore",
				message: `svelte-ignore must list only warning codes, got "${codes}": put the reason in its own comment`,
			});
	}
	// Blank comments but keep newlines so reported line numbers stay right.
	const src = source.replace(COMMENT, (m) => m.replace(/[^\n]/g, " "));
	const isHarness = /\.test\.|\/tests?\//.test(file);
	const regions = cssRegions(file, src);
	const css = regions.map((r) => r.text).join("\n");

	if (/(^|[^-\w])backdrop-filter\s*:/m.test(css)) {
		for (const r of regions)
			for (const m of r.text.matchAll(/(^|[^-\w])will-change\s*:/g))
				v.push({
					file,
					line: lineOf(src, r.offset + (m.index ?? 0) + m[1].length),
					rule: "will-change",
					message:
						"will-change in a file that uses backdrop-filter: it promotes the layer and kills the blur",
				});
	}

	for (const r of regions) {
		if (!isHarness && !/styles[\\/]tokens\.css$/.test(file))
			for (const m of r.text.matchAll(/(?<![\w.-])100(?:vh|dvh|svh|lvh)\b/g))
				v.push({
					file,
					line: lineOf(src, r.offset + (m.index ?? 0)),
					rule: "viewport-unit",
					message: `literal ${m[0]}: use var(--ca-vh) (dynamic viewport with a 100vh fallback)`,
				});
		if (!isHarness)
			for (const m of r.text.matchAll(/\((min|max)-width:\s*([\d.]+)(px|rem|em)\)/g)) {
				const px = Number(m[2]) * (m[3] === "px" ? 1 : 16);
				const ok = BREAKPOINTS.some((b) => (m[1] === "min" ? px === b : px === b - 0.02));
				if (!ok)
					v.push({
						file,
						line: lineOf(src, r.offset + (m.index ?? 0)),
						rule: "breakpoint",
						message: `${m[0]}: use the breakpoint scale (min-width ${BREAKPOINTS.join("/")}px, max-width N-0.02px) or a container query`,
					});
			}

		for (const rule of r.text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
			const body = rule[2] ?? "";
			const bodyAt = r.offset + (rule.index ?? 0) + (rule[1]?.length ?? 0) + 1;
			const std = /(^|[^-\w])backdrop-filter\s*:/.exec(body);
			const pre = /-webkit-backdrop-filter\s*:/.exec(body);
			if (std && pre && std.index + std[1].length < pre.index)
				v.push({
					file,
					line: lineOf(src, bodyAt + std.index + std[1].length),
					rule: "backdrop-order",
					message:
						"backdrop-filter is declared before -webkit-backdrop-filter: Lightning CSS drops the standard one",
				});

			const sel = rule[1] ?? "";
			const disabledSel =
				/:disabled|\[disabled|\[aria-disabled|\[data-disabled|--disabled|__disabled|:global\([^)]*disabled/.test(
					sel
				);
			const td = /(^|[^-\w])color\s*:\s*var\(--ca-text-disabled\)/.exec(body);
			if (td && !disabledSel && !/prose\.css$/.test(file))
				v.push({
					file,
					line: lineOf(src, bodyAt + td.index + td[1].length),
					rule: "text-disabled",
					message:
						"--ca-text-disabled is for disabled controls only: use --ca-text-hint for de-emphasised information",
				});
			if (/:focus(-visible|-within)?\b/.test(sel)) {
				const fr = /--ca-brand-main/.exec(body);
				if (fr && /outline[\w-]*\s*:[^;]*--ca-brand-main/.test(body))
					v.push({
						file,
						line: lineOf(src, bodyAt + fr.index),
						rule: "focus-ring",
						message:
							"focus rule reads --ca-brand-main: use var(--ca-focus-ring) so the ring token themes it",
					});
			}

			if (INPUT_SELECTOR.test(rule[1] ?? "")) {
				const fs = /(^|[^-\w])font-size\s*:\s*([\d.]+)px/.exec(body);
				if (fs && Number(fs[2]) < 16 && !/max\(/.test(body.slice(fs.index, fs.index + 40)))
					v.push({
						file,
						line: lineOf(src, bodyAt + fs.index + fs[1].length),
						rule: "input-font-size",
						message: `font-size ${fs[2]}px on an input rule: iOS zooms on focus below 16px (use max(16px, ...) under coarse pointers)`,
					});
			}
		}
	}
	return v;
}

function* walk(dir: string): Generator<string> {
	for (const e of readdirSync(dir, { withFileTypes: true })) {
		const p = join(dir, e.name);
		if (e.isDirectory()) {
			if (e.name !== "node_modules" && e.name !== "__screenshots__") yield* walk(p);
		} else if (/\.(css|svelte)$/.test(e.name)) yield p;
	}
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const here = dirname(fileURLToPath(import.meta.url));
	// The package and the docs site share the contract.
	const roots = [join(here, "../src/lib"), join(here, "../../../site/src")];
	const all: Violation[] = [];
	for (const root of roots)
		for (const f of walk(root))
			all.push(...lintSource(relative(join(here, "../../.."), f), readFileSync(f, "utf8")));
	for (const x of all) console.error(`${x.file}:${x.line}  [${x.rule}] ${x.message}`);
	if (all.length) {
		console.error(`\n${all.length} token lint violation(s)`);
		process.exit(1);
	}
	console.log("lint-tokens: ok");
}
