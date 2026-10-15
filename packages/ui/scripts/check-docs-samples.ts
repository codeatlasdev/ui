/**
 * Type-checks the `svelte` code fences of the docs site with svelte-check, against the built package
 * types (`dist`), exactly as a consumer app would compile them.
 *
 * A fence is checked when it imports from `@codeatlasdev/ui*`: those are the ones that claim API
 * usage. Docs samples are often fragments, so the extractor makes them compilable without hiding
 * real mistakes:
 *  - `…` and `/* … *\/` placeholders are removed;
 *  - names the sample uses but never declares (`users`, `save`, `page`, a `bind:` target) become
 *    ambient `any` declarations: a docs sample may assume app state;
 *  - a bare markup fence (no `<script>`) gets an import-free wrapper only when it names no package
 *    component, so it is skipped.
 * Unknown components and exports, props a component does not declare, wrong prop types, unclosed
 * blocks and TypeScript syntax in a non-`lang="ts"` script all fail.
 *
 *   bun scripts/check-docs-samples.ts
 */
import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const DOCS = join(REPO, "site/src/content/docs");
const OUT = join(REPO, "site/.cache/docs-samples");
const SVELTE_CHECK = join(REPO, "packages/ui/node_modules/.bin/svelte-check");

export interface Sample {
	/** Docs page, relative to the docs root. */
	page: string;
	/** 0-based position among the page's checked fences. */
	index: number;
	/** 1-based line of the opening fence in the MDX file. */
	line: number;
	file: string;
}

const walk = (dir: string): string[] =>
	readdirSync(dir).flatMap((f) => {
		const p = join(dir, f);
		return statSync(p).isDirectory() ? walk(p) : p.endsWith(".mdx") ? [p] : [];
	});

/** Free identifiers the sample reads but does not declare, found cheaply from the markup and script. */
function ambientNames(code: string): string[] {
	const declared = new Set<string>();
	for (const m of code.matchAll(
		/\b(?:const|let|var|function|class|import|type|interface)\s+(?:\{([^}]*)\}|(\w+))/g
	)) {
		for (const n of (m[1] ?? m[2] ?? "").split(",")) {
			const name = n
				.trim()
				.split(/\s+as\s+/)
				.pop()
				?.replace(/^type\s+/, "");
			if (name) declared.add(name);
		}
	}
	for (const m of code.matchAll(/\{#snippet\s+(\w+)/g)) declared.add(m[1]);
	const used = new Set<string>();
	// `bind:value={x}`, `onclick={x}`, `{x}`, `{@render x()}`, `data={x}`
	for (const m of code.matchAll(
		/(?:bind:\w+|\bon\w+|\b[a-z][\w-]*)=\{\s*([A-Za-z_$][\w$]*)\s*[}(.[]/g
	))
		used.add(m[1]);
	for (const m of code.matchAll(/(?<![\w$.])\{\s*([A-Za-z_$][\w$]*)\s*\}/g)) used.add(m[1]);
	for (const m of code.matchAll(/\bbind:(\w+)(?![=\w])/g)) used.add(m[1]);
	for (const m of code.matchAll(/<[A-Z]\w*\b[^>]*?\{(?:\.\.\.)?\s*([A-Za-z_$][\w$]*)\s*\}/g))
		used.add(m[1]);
	const skip = new Set(["children", "true", "false", "null", "undefined", "$props", "$state"]);
	return [...used].filter((n) => !declared.has(n) && !skip.has(n) && !n.startsWith("$"));
}

/** Turns a docs fence into a compilable component, or `null` when it is not a checkable sample. */
export function normalize(raw: string): string | null {
	if (!/from\s+["']@codeatlasdev\/ui/.test(raw)) return null;
	let code = raw
		.replace(/\/\*\s*…\s*\*\//g, "")
		.replace(/<!--[\s\S]*?-->/g, "")
		.replace(/…/g, "");
	// A fence that mixes several top-level scripts shows separate files; check only the first part.
	const scripts = [...code.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/g)];
	if (scripts.length > 1) {
		const second = scripts[1].index ?? code.length;
		code = code.slice(0, second);
	}
	// Placeholders for app state the sample assumes. `$state()` makes them valid `bind:` targets. In a
	// `lang="ts"` script they are typed `any` so they fit any prop; a plain script gets no annotation,
	// so TypeScript syntax written in it is still reported.
	const names = ambientNames(code);
	const tag = code.match(/<script\b[^>]*>/);
	const isTs = !tag || /\blang=["']ts["']/.test(tag[0]);
	const decl = names.map((n) => `let ${n}${isTs ? ": any" : ""} = $state();`).join("\n");
	if (!tag) return `<script lang="ts">\n${decl}\n</script>\n${code}`;
	return decl ? code.replace(tag[0], `${tag[0]}\n${decl}`) : code;
}

export function extractSamples(): Sample[] {
	rmSync(OUT, { recursive: true, force: true });
	mkdirSync(OUT, { recursive: true });
	const samples: Sample[] = [];
	for (const mdx of walk(DOCS)) {
		const src = readFileSync(mdx, "utf8");
		const page = relative(DOCS, mdx);
		let index = 0;
		for (const m of src.matchAll(/^([ \t]*)```svelte[^\n]*\n([\s\S]*?)^[ \t]*```/gm)) {
			const indent = m[1].length;
			const body = m[2]
				.split("\n")
				.map((l) => l.slice(Math.min(indent, l.length - l.trimStart().length)))
				.join("\n");
			const code = normalize(body);
			if (code === null) continue;
			const line = src.slice(0, m.index).split("\n").length;
			const file = `${page.replace(/\.mdx$/, "").replace(/[/.]/g, "_")}_${index}.svelte`;
			writeFileSync(join(OUT, file), code);
			samples.push({ page, index: index++, line, file });
		}
	}
	writeFileSync(
		join(OUT, "tsconfig.json"),
		JSON.stringify({ extends: "../../tsconfig.json", include: ["./*.svelte"] })
	);
	return samples;
}

export interface SampleError {
	page: string;
	line: number;
	message: string;
}

/** Runs svelte-check over the extracted samples; returns one entry per error, mapped back to its docs page. */
export async function checkDocsSamples(
	extra: Record<string, string> = {}
): Promise<{ checked: number; errors: SampleError[] }> {
	const samples = extractSamples();
	// Extra fences (tests feed known-bad ones to prove the check can fail), reported under their own name.
	for (const [name, body] of Object.entries(extra)) {
		const code = normalize(body);
		if (code === null) continue;
		const file = `extra_${name}.svelte`;
		writeFileSync(join(OUT, file), code);
		samples.push({ page: name, index: 0, line: 0, file });
	}
	const proc = Bun.spawn(
		[
			SVELTE_CHECK,
			"--tsconfig",
			join(OUT, "tsconfig.json"),
			"--workspace",
			OUT,
			"--output",
			"machine",
		],
		{ cwd: join(REPO, "site"), stdout: "pipe", stderr: "pipe" }
	);
	const [out, err] = await Promise.all([
		new Response(proc.stdout).text(),
		new Response(proc.stderr).text(),
	]);
	await proc.exited;
	if (!/COMPLETED/.test(out)) throw new Error(`svelte-check did not complete:\n${out}${err}`);
	const byFile = new Map(samples.map((s) => [s.file, s]));
	const errors: SampleError[] = [];
	for (const m of out.matchAll(/^\d+ ERROR "([^"]+)" (\d+):\d+ "((?:[^"\\]|\\.)*)"/gm)) {
		const sample = byFile.get(m[1]);
		errors.push({
			page: sample?.page ?? m[1],
			line: (sample?.line ?? 0) + Number(m[2]),
			message: (JSON.parse(`"${m[3]}"`) as string)
				.replace(/\n/g, " ")
				.split("https://svelte.dev")[0]
				.trim(),
		});
	}
	return { checked: samples.length, errors };
}

if (import.meta.main) {
	const { checked, errors } = await checkDocsSamples();
	for (const e of errors) console.log(`${e.page}:${e.line}  ${e.message}`);
	console.log(`${checked} samples checked, ${errors.length} errors`);
	process.exit(errors.length ? 1 : 0);
}
