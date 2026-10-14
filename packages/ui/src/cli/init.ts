import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { unifiedDiff } from "./diff.ts";

export type Framework = "sveltekit" | "astro";

interface Pkg {
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
}

/** One file the setup wants: created when absent, otherwise patched (diff only unless `--write`). */
interface Step {
	path: string;
	/** Content for a file that does not exist yet. */
	create?: string;
	/** Rewrites an existing file. Returns the same text when nothing needs to change, `null` when it cannot patch safely. */
	patch?: (current: string) => string | null;
	/** Shown when `patch` returns `null`. */
	manual?: string;
}

const THEME_BODY = `/**
 * One theme for the whole app. Pass it to caThemeHandle / caThemePlugin (SvelteKit)
 * or caUI (Astro) so the first paint already has the right preset and scheme.
 * Add a brand color with \`presets: [{ id: "brand", color: "#2563eb" }]\` and
 * \`defaultPreset: "brand"\`.
 *
 * Keep this a plain object and a type-only import: vite.config / astro.config load it in Node,
 * where the package root (which imports .svelte files) cannot be evaluated.
 */
export const theme: ThemeOptions = {
	defaultPreset: "amber",
	defaultScheme: "system",
};
`;
const THEME_TS = `import type { ThemeOptions } from "@codeatlasdev/ui/vite";\n\n${THEME_BODY}`;
const ASTRO_THEME_TS = `import type { ThemeOptions } from "@codeatlasdev/ui/astro";\n\n${THEME_BODY}`;

const VIEWPORT =
	"width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content";

function readDeps(root: string): Record<string, string> | null {
	const pkgPath = join(root, "package.json");
	if (!existsSync(pkgPath)) return null;
	const pkg: Pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
	return { ...pkg.dependencies, ...pkg.devDependencies };
}

export function detectFramework(root: string): Framework | null {
	const deps = readDeps(root);
	if (deps?.["@sveltejs/kit"]) return "sveltekit";
	if (deps?.astro) return "astro";
	return null;
}

/**
 * Major version of `@sveltejs/kit`. The installed package is authoritative; the declared range is
 * the fallback before `install` ran. Ranges like `^3.0.1`, `~2.20.0`, `>=3`, `3.0.1`, `next` all
 * resolve to the first number; anything unparseable counts as 2 (the long-standing shape).
 */
export function kitMajor(root: string): number {
	const installed = join(root, "node_modules/@sveltejs/kit/package.json");
	let version: string | undefined = readDeps(root)?.["@sveltejs/kit"];
	if (existsSync(installed)) {
		const pkg: unknown = JSON.parse(readFileSync(installed, "utf8"));
		if (pkg && typeof pkg === "object" && "version" in pkg && typeof pkg.version === "string")
			version = pkg.version;
	}
	const major = Number(version?.match(/\d+/)?.[0]);
	return Number.isInteger(major) && major > 0 ? major : 2;
}

/**
 * Import specifier for `src/lib/theme` from `src/hooks.server.ts`. Kit 3 removed `$lib` (using it
 * fails with `module_removed_lib`) in favor of the `#lib` package import that `sv create` writes
 * into package.json; Kit 2 apps keep `$lib`. A Kit 3 app without the `#lib` map gets a relative
 * path, which works everywhere. The `.ts` extension is explicit because neither the `#lib/*` map
 * nor Node's native config loader add one.
 */
function themeImport(root: string): string {
	const pkg: { imports?: Record<string, unknown> } = JSON.parse(
		readFileSync(join(root, "package.json"), "utf8")
	);
	if (pkg.imports && "#lib/*" in pkg.imports) return "#lib/theme.ts";
	return kitMajor(root) >= 3 ? "./lib/theme.ts" : "$lib/theme";
}

/** Insert `line` after the last top-level import (or at the top when there is none). */
function addImport(src: string, line: string): string {
	if (src.includes(line)) return src;
	const imports = [...src.matchAll(/^import[^;]*?;[ \t]*$/gm)];
	const last = imports.at(-1);
	if (!last) return `${line}\n${src}`;
	const at = (last.index ?? 0) + last[0].length;
	return `${src.slice(0, at)}\n${line}${src.slice(at)}`;
}

// ── SvelteKit ─────────────────────────────────────────────────────────────────

/** Plugins init adds to `plugins`, in this order, each only when absent. Both go after `sveltekit()`. */
const VITE_PLUGINS = [
	{ name: "caThemePlugin", call: "caThemePlugin(theme)" },
	{ name: "caErrorPlugin", call: "caErrorPlugin({ scaffold: true })" },
] as const;

const VITE_IMPORT = /import\s*\{([^}]*)\}\s*from\s*["']@codeatlasdev\/ui\/vite["'];?/;

/** Add `names` to an existing `@codeatlasdev/ui/vite` import, or insert one. Sorted, so the output is stable. */
function mergeViteImport(src: string, names: string[]): string {
	const m = src.match(VITE_IMPORT);
	if (!m)
		return addImport(
			src,
			`import { ${[...names].sort().join(", ")} } from "@codeatlasdev/ui/vite";`
		);
	const have = m[1]
		.split(",")
		.map((n) => n.trim())
		.filter(Boolean);
	const all = [...new Set([...have, ...names])].sort();
	return src.replace(m[0], `import { ${all.join(", ")} } from "@codeatlasdev/ui/vite";`);
}

function viteConfigPatch(src: string): string | null {
	const missing = VITE_PLUGINS.filter((p) => !src.includes(`${p.name}(`));
	if (!missing.length) return src;
	// `plugins: [ sveltekit(...) ]`: append after the last element of the array.
	const m = src.match(/plugins:\s*\[/);
	if (!m || m.index === undefined) return null;
	// Find the matching `]` by bracket depth, skipping strings.
	let depth = 0;
	let end = -1;
	for (let i = m.index + m[0].length - 1; i < src.length; i++) {
		const ch = src[i];
		if (ch === '"' || ch === "'" || ch === "`") {
			const q = ch;
			for (i++; i < src.length && src[i] !== q; i++) if (src[i] === "\\") i++;
		} else if (ch === "[" || ch === "(" || ch === "{") depth++;
		else if (ch === "]" || ch === ")" || ch === "}") {
			depth--;
			if (depth === 0) {
				end = i;
				break;
			}
		}
	}
	if (end < 0) return null;
	const before = src.slice(0, end).replace(/\s*$/, "");
	const comma = before.endsWith(",") || before.endsWith("[") ? "" : ",";
	const added = missing.map((p) => `\n\t\t${p.call}`).join(",");
	const next = `${before}${comma}${added}\n\t${src.slice(end)}`;
	// An app that already has caThemePlugin has its own `theme` import; only add ours with the plugin.
	const withImports = mergeViteImport(
		next,
		VITE_PLUGINS.filter((p) => next.includes(`${p.name}(`)).map((p) => p.name)
	);
	return missing.some((p) => p.name === "caThemePlugin")
		? addImport(withImports, 'import { theme } from "./src/lib/theme.ts";')
		: withImports;
}

const HOOKS_KIT_IMPORT = /import\s*\{([^}]*)\}\s*from\s*["']@codeatlasdev\/ui\/kit["'];?/;

/** Add `names` to an existing `@codeatlasdev/ui/kit` import, or insert one. */
function mergeKitImport(src: string, names: string[]): string {
	const m = src.match(HOOKS_KIT_IMPORT);
	if (!m) return addImport(src, `import { ${names.join(", ")} } from "@codeatlasdev/ui/kit";`);
	const have = m[1]
		.split(",")
		.map((n) => n.trim())
		.filter(Boolean);
	const all = [...have, ...names.filter((n) => !have.includes(n))];
	return src.replace(m[0], `import { ${all.join(", ")} } from "@codeatlasdev/ui/kit";`);
}

const HANDLE_DEF = /export\s+(const|function|async function)\s+handle\b/;
const HANDLE_ERROR_DEF = /export\s+(const|function|async function)\s+handleError\b/;

/**
 * Adds what is missing, independently: the theme `handle` and the `handleError`. An app that already
 * defines either owns it: init never rewrites it (a missing `handle` next to an existing one is
 * reported as manual, since composing two pipelines is the app's call).
 */
function hooksPatch(themeSpec: string) {
	return (src: string): string | null => {
		const needHandle = !src.includes("caThemeHandle");
		const needError = !HANDLE_ERROR_DEF.test(src) && !src.includes("createErrorHandler");
		if (needHandle && HANDLE_DEF.test(src)) return null;
		if (!needHandle && !needError) return src;
		const kitNames = [
			...(needHandle ? ["caThemeHandle"] : []),
			...(needError ? ["createErrorHandler"] : []),
		];
		let out = src;
		if (needHandle) out = addImport(out, 'import { sequence } from "@sveltejs/kit/hooks";');
		out = mergeKitImport(out, kitNames);
		if (needHandle) out = addImport(out, `import { theme } from "${themeSpec}";`);
		out = out.replace(/\s*$/, "\n");
		if (needHandle) out += "\nexport const handle = sequence(caThemeHandle(theme));\n";
		if (needError) out += "\nexport const handleError = createErrorHandler();\n";
		return out;
	};
}

const hooksNew = (themeSpec: string) => `import { sequence } from "@sveltejs/kit/hooks";
import { caThemeHandle, createErrorHandler } from "@codeatlasdev/ui/kit";
import { theme } from "${themeSpec}";

// Puts the theme init script in every SSR/prerendered page so the first paint is already correct.
export const handle = sequence(caThemeHandle(theme));

// Sanitizes unexpected server errors (no stack or 5xx message reaches the user) and gives each an id.
export const handleError = createErrorHandler();
`;

const LAYOUT_NEW = `<script lang="ts">
	import "@codeatlasdev/ui/styles/global.css";
	import { colorScheme } from "@codeatlasdev/ui";
	import { onMount } from "svelte";

	let { children } = $props();

	onMount(() => colorScheme.init());
</script>

{@render children()}
`;

function layoutPatch(src: string): string | null {
	let out = src;
	if (
		!out.includes("@codeatlasdev/ui/styles/global.css") ||
		!/colorScheme\s*\.\s*init\s*\(/.test(out)
	) {
		const script = out.match(/<script\b[^>]*>/);
		if (!script || script.index === undefined) {
			out = `<script lang="ts">\n\timport "@codeatlasdev/ui/styles/global.css";\n\timport { colorScheme } from "@codeatlasdev/ui";\n\timport { onMount } from "svelte";\n\n\tonMount(() => colorScheme.init());\n</script>\n\n${out}`;
			return out;
		}
		const insertAt = script.index + script[0].length;
		const lines: string[] = [];
		if (!out.includes("@codeatlasdev/ui/styles/global.css"))
			lines.push('\timport "@codeatlasdev/ui/styles/global.css";');
		if (!/import\s*\{[^}]*\bcolorScheme\b[^}]*\}\s*from\s*["']@codeatlasdev\/ui["']/.test(out))
			lines.push('\timport { colorScheme } from "@codeatlasdev/ui";');
		if (!/import\s*\{[^}]*\bonMount\b[^}]*\}\s*from\s*["']svelte["']/.test(out))
			lines.push('\timport { onMount } from "svelte";');
		out = `${out.slice(0, insertAt)}\n${lines.join("\n")}${out.slice(insertAt)}`;
		if (!/colorScheme\s*\.\s*init\s*\(/.test(out)) {
			const close = out.indexOf("</script>");
			out = `${out.slice(0, close).replace(/\s*$/, "")}\n\n\tonMount(() => colorScheme.init());\n${out.slice(close)}`;
		}
	}
	return out;
}

function appHtmlPatch(src: string): string | null {
	if (src.includes("viewport-fit=cover")) return src;
	const m = src.match(/<meta\s+name="viewport"\s+content="[^"]*"\s*\/?>/);
	if (!m) return null;
	return src.replace(m[0], `<meta name="viewport" content="${VIEWPORT}" />`);
}

/**
 * Kit 3 moved configuration into the `sveltekit(...)` Vite plugin and generates its tsconfig base
 * under `$app/tsconfig`. Both live in files the user owns, so init reports instead of rewriting.
 */
function kit3Notes(root: string): string[] {
	const notes: string[] = [];
	const config = ["svelte.config.js", "svelte.config.ts", "svelte.config.mjs"].find((f) =>
		existsSync(join(root, f))
	);
	if (config)
		notes.push(
			`SvelteKit 3 ignores ${config} (config_file_unsupported). Move its options out of the \`kit\` namespace and into the plugin in vite.config: \`sveltekit({ adapter, ... })\`, then delete ${config}.`
		);
	const tsconfig = join(root, "tsconfig.json");
	if (existsSync(tsconfig) && !readFileSync(tsconfig, "utf8").includes("$app/tsconfig"))
		notes.push(
			'SvelteKit 3 no longer generates .svelte-kit/tsconfig.json. Set `"extends": "$app/tsconfig"` in tsconfig.json (tsconfig_extends_missing); it already allows `.ts` import extensions, which vite.config needs.'
		);
	return notes;
}

function sveltekitSteps(root: string): Step[] {
	const lib = themeImport(root);
	return [
		{ path: "src/lib/theme.ts", create: THEME_TS },
		{
			path: "src/hooks.server.ts",
			create: hooksNew(lib),
			patch: hooksPatch(lib),
			manual:
				'Compose caThemeHandle(theme) from "@codeatlasdev/ui/kit" into your existing `handle` with sequence().',
		},
		{
			path: "vite.config.ts",
			patch: viteConfigPatch,
			manual: 'Add caThemePlugin(theme) from "@codeatlasdev/ui/vite" to `plugins`.',
		},
		{ path: "src/routes/+layout.svelte", create: LAYOUT_NEW, patch: layoutPatch },
		{ path: "src/app.html", patch: appHtmlPatch, manual: `Set the viewport meta to: ${VIEWPORT}` },
	];
}

// ── Astro ─────────────────────────────────────────────────────────────────────

function astroConfigPatch(src: string): string | null {
	if (src.includes("caUI(")) return src;
	const m = src.match(/integrations:\s*\[/);
	if (!m || m.index === undefined) return null;
	const at = m.index + m[0].length;
	const rest = src.slice(at);
	const empty = /^\s*\]/.test(rest);
	const next = `${src.slice(0, at)}caUI(theme)${empty ? "" : ", "}${rest}`;
	return addImport(
		addImport(next, 'import { caUI } from "@codeatlasdev/ui/astro";'),
		'import { theme } from "./src/theme.ts";'
	);
}

const ASTRO_LAYOUT = `---
import "@codeatlasdev/ui/styles/global.css";
---
<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="${VIEWPORT}" />
		<title>My app</title>
	</head>
	<body>
		<slot />
		<script>
			// One store instance for the page: theme switches and OS scheme changes stay in sync.
			import { colorScheme } from "@codeatlasdev/ui";
			colorScheme.init();
		</script>
	</body>
</html>
`;

function astroLayoutPatch(src: string): string | null {
	let out = src;
	if (!out.includes("@codeatlasdev/ui/styles/global.css")) {
		const fm = out.match(/^---\n/);
		out = fm
			? out.replace(/^---\n/, '---\nimport "@codeatlasdev/ui/styles/global.css";\n')
			: `---\nimport "@codeatlasdev/ui/styles/global.css";\n---\n${out}`;
	}
	if (!out.includes("viewport-fit=cover")) {
		const m = out.match(/<meta\s+name="viewport"\s+content="[^"]*"\s*\/?>/);
		if (m) out = out.replace(m[0], `<meta name="viewport" content="${VIEWPORT}" />`);
	}
	if (!/colorScheme\s*\.\s*init\s*\(/.test(out)) {
		const script = `\t\t<script>\n\t\t\timport { colorScheme } from "@codeatlasdev/ui";\n\t\t\tcolorScheme.init();\n\t\t</script>\n`;
		if (!out.includes("</body>")) return null;
		out = out.replace("</body>", `${script}\t</body>`);
	}
	return out;
}

/** First `.astro` file under src/layouts that renders `<html>`: the document shell to patch. */
function findAstroLayout(root: string): string | null {
	const dir = join(root, "src/layouts");
	if (!existsSync(dir)) return null;
	for (const f of readdirSync(dir)) {
		if (f.endsWith(".astro") && /<html[\s>]/.test(readFileSync(join(dir, f), "utf8")))
			return `src/layouts/${f}`;
	}
	return null;
}

function astroSteps(root: string): Step[] {
	const configName =
		["astro.config.mjs", "astro.config.ts", "astro.config.js", "astro.config.mts"].find((f) =>
			existsSync(join(root, f))
		) ?? "astro.config.mjs";
	const layout = findAstroLayout(root);
	return [
		{ path: "src/theme.ts", create: ASTRO_THEME_TS },
		{
			path: configName,
			patch: astroConfigPatch,
			manual: 'Add caUI(theme) from "@codeatlasdev/ui/astro" to `integrations`.',
		},
		layout
			? {
					path: layout,
					patch: astroLayoutPatch,
					manual: `Import "@codeatlasdev/ui/styles/global.css", set the viewport to "${VIEWPORT}" and call colorScheme.init() in a client <script>.`,
				}
			: { path: "src/layouts/Base.astro", create: ASTRO_LAYOUT },
	];
}

// ── runner ────────────────────────────────────────────────────────────────────

export interface InitOptions {
	/** Apply patches to existing files. Without it, only the diff is printed. */
	write?: boolean;
	log?: (line: string) => void;
}

/** Returns false when the project type is unknown or an existing file could not be patched. */
export function init(
	root: string,
	{ write = false, log = console.log }: InitOptions = {}
): boolean {
	const fw = detectFramework(root);
	if (!fw) {
		log(
			"No SvelteKit or Astro project found (package.json needs @sveltejs/kit or astro). Run this in the project root."
		);
		return false;
	}
	log(`Detected ${fw === "sveltekit" ? "SvelteKit" : "Astro"}.\n`);

	let ok = true;
	let pending = 0;
	for (const step of fw === "sveltekit" ? sveltekitSteps(root) : astroSteps(root)) {
		const abs = join(root, step.path);
		if (!existsSync(abs)) {
			if (step.create === undefined) {
				log(`  skip    ${step.path} (not found)`);
				if (step.manual) log(`          ${step.manual}`);
				continue;
			}
			mkdirSync(dirname(abs), { recursive: true });
			writeFileSync(abs, step.create);
			log(`  create  ${step.path}`);
			continue;
		}
		const current = readFileSync(abs, "utf8");
		const next = step.patch?.(current);
		if (next === undefined || next === current) {
			log(`  ok      ${step.path} (already set up)`);
		} else if (next === null) {
			ok = false;
			log(`  manual  ${step.path}: could not patch safely. ${step.manual ?? ""}`);
		} else if (write) {
			writeFileSync(abs, next);
			log(`  patch   ${step.path}`);
		} else {
			pending++;
			log(
				`  diff    ${step.path} (exists, not modified)\n${unifiedDiff(relative(root, abs), current, next)}\n`
			);
		}
	}
	if (pending)
		log(
			`\n${pending} existing file(s) left untouched. Re-run with --write to apply the diffs above.`
		);
	const notes = fw === "sveltekit" && kitMajor(root) >= 3 ? kit3Notes(root) : [];
	for (const n of notes) log(`\n  note    ${n}`);
	if (ok && !pending && !notes.length)
		log("\nDone. Run your dev server: the theme paints on the first frame.");
	return ok;
}
