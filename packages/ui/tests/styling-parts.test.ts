import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
	buildManifest,
	buildParts,
	extractDataAttributes,
	extractStyling,
	partsMarkdown,
	skillMarkdown,
} from "../scripts/build-manifest.ts";

const LIB = join(import.meta.dir, "../src/lib");
const manifest = buildManifest();
const styling = (name: string) => manifest.components.find((c) => c.name === name)?.styling;

describe("styling contract (#381)", () => {
	it("splits stable parts from internal ones by the ca-x- prefix and @keyframes names", () => {
		const s = extractStyling(
			`.ca-box { color: red }
			.ca-box--dense { gap: 0 }
			.ca-box__x-hint { opacity: 0 }
			.ca-x-measure { position: absolute }
			@keyframes ca-box-in { from { opacity: 0 } }
			.ca-box { animation: ca-box-in 1s }`,
			""
		);
		expect(s.parts.filter((p) => p.stable).map((p) => p.name)).toEqual([
			"ca-box",
			"ca-box--dense",
			"ca-box__x-hint",
		]);
		expect(s.parts.filter((p) => !p.stable).map((p) => p.name)).toEqual([
			"ca-box-in",
			"ca-x-measure",
		]);
	});

	it("lists component-scoped variables the component declares or reads, never global tokens", () => {
		const s = extractStyling(
			`.ca-card { padding: var(--ca-card-padding); gap: var(--ca-card-gap, var(--ca-space-4)); }`,
			"",
			new Set(["--ca-card-padding", "--ca-space-4"])
		);
		expect(s.variables).toEqual(["--ca-card-gap"]);
	});

	it("reads data-* hooks only when the component CSS selects them, with their values", () => {
		expect(
			extractDataAttributes(
				`.ca-progress[data-size='sm'] { a: b } .ca-progress[data-size="md"] { a: b } .ca-x[data-open] { a: b }`
			)
		).toEqual([
			{ name: "data-open", values: [] },
			{ name: "data-size", values: ["md", "sm"] },
		]);
	});

	it("puts Button's real hooks in the manifest and keeps Spinner arcs out of it", () => {
		const btn = styling("Button");
		expect(btn?.parts.map((p) => p.name)).toContain("ca-btn__trailing");
		expect(btn?.parts.find((p) => p.name === "ca-btn--filled")?.stable).toBe(true);
		expect(btn?.parts.map((p) => p.name)).not.toContain("ca-spinner__arc");
	});

	it("keeps the component-scoped variables of Card and Progress", () => {
		expect(styling("Card")?.variables).toContain("--ca-card-gap");
		expect(styling("Progress")?.data).toEqual([{ name: "data-size", values: ["lg", "md", "sm"] }]);
	});

	it("never lists a variable that is a global token, and never an unstable part as stable", () => {
		const tokens = new Set(
			[...readFileSync(join(LIB, "styles/tokens.css"), "utf8").matchAll(/(--ca-[\w-]+)\s*:/g)].map(
				(m) => m[1]
			)
		);
		for (const c of manifest.components) {
			for (const v of c.styling?.variables ?? [])
				expect(tokens.has(v), `${c.name} ${v}`).toBe(false);
			for (const p of c.styling?.parts ?? [])
				if (p.name.startsWith("ca-x-")) expect(p.stable, `${c.name} ${p.name}`).toBe(false);
		}
	});

	it("keeps `classes` equal to the stable parts, so nothing that read it breaks", () => {
		for (const c of manifest.components)
			expect(
				c.styling?.parts.filter((p) => p.stable).map((p) => p.name),
				c.name
			).toEqual(c.classes);
	});

	it("fails when a documented stable part is no longer applied by any markup or script in the lib", () => {
		// Selectors alone do not make a hook: a class must be written outside CSS (markup, a class helper,
		// a template string). Shared sheets (dialog.css) are applied by another component, hence repo-wide.
		const applied = appliedText();
		for (const c of manifest.components)
			for (const p of c.styling.parts.filter((x) => x.stable))
				expect(isApplied(p.name, applied), `${c.name} .${p.name}`).toBe(true);
	});

	it("publishes parts.json and a markdown section with the stable/internal flag", () => {
		const parts = buildParts(manifest);
		const btn = parts.components.find((c) => c.name === "Button");
		expect(btn?.parts.some((p) => p.name === "ca-btn" && p.stable)).toBe(true);
		expect(partsMarkdown(manifest)).toContain("`ca-btn--filled`");
		expect(skillMarkdown(manifest)).toContain("Parts: ");
	});
});

/** Every `.svelte`/`.ts` source under `src/lib` with `<style>` blocks and comments removed. */
function appliedText(): string {
	const out: string[] = [];
	const walk = (dir: string) => {
		for (const e of readdirSync(dir, { withFileTypes: true })) {
			const path = join(dir, e.name);
			if (e.isDirectory()) walk(path);
			else if (/\.(svelte|ts)$/.test(e.name) && !/\.test\.|Matrix/.test(e.name))
				out.push(
					readFileSync(path, "utf8")
						.replace(/<style[\s\S]*?<\/style>/g, "")
						.replace(/\/\*[\s\S]*?\*\//g, "")
				);
		}
	};
	walk(LIB);
	return out.join("\n");
}

/** True when `name`, or the static stem of an interpolated class (`ca-btn--{variant}`), is written in `text`. */
function isApplied(name: string, text: string): boolean {
	if (text.includes(name)) return true;
	const stems = [name.replace(/[A-Za-z0-9]+$/, ""), name.match(/^(.*?(?:--|__))[^-_]/)?.[1]];
	return stems.some(
		(s) => s && s.length > 3 && (text.includes(`${s}{`) || text.includes(`${s}\${`))
	);
}
