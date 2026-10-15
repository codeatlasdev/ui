import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Vite's dependency scanner finds `<script>` blocks in .svelte files with a regex, so a JS
// `<script>` written inside the markup (e.g. in an `{@html}` string) is parsed as a script block.
// The scan then fails, pre-bundling is skipped and unrelated component tests break in CI (#99).
// Build such tags in a .ts module instead; a non-JS `type` (JSON-LD) is skipped by the scanner.
const lib = fileURLToPath(new URL("../src/lib/", import.meta.url));

function* components(dir: string): Generator<string> {
	for (const name of readdirSync(dir)) {
		const path = join(dir, name);
		if (statSync(path).isDirectory()) yield* components(path);
		else if (name.endsWith(".svelte")) yield path;
	}
}

const NON_JS_TYPE = /\btype=["'](?!module|text\/javascript)[^"']+["']/;

describe("svelte script tags", () => {
	it("no JS <script> tag inside markup", () => {
		const offenders: string[] = [];
		for (const file of components(lib)) {
			const src = readFileSync(file, "utf8");
			for (const m of src.matchAll(/<script\b[^>]*>/g)) {
				const atLineStart = m.index === 0 || src[m.index - 1] === "\n";
				if (!atLineStart && !NON_JS_TYPE.test(m[0])) {
					const line = src.slice(0, m.index).split("\n").length;
					offenders.push(`${file.slice(lib.length)}:${line}`);
				}
			}
		}
		expect(offenders).toEqual([]);
	});
});
