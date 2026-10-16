#!/usr/bin/env node
/**
 * codeatlas-ui: project setup and migration.
 *
 *   bunx @codeatlasdev/ui init [--write] [--dir <path>]
 *   bunx @codeatlasdev/ui migrate [--write] [--strict] [paths...]
 *   bunx @codeatlasdev/ui brand [--theme <file>] [--mark <svg>] [--out <dir>] ...
 *   bunx @codeatlasdev/ui workarounds [paths...]
 *
 * `init` is a dry run unless `--write` is passed: it reports the files it would create and prints a
 * unified diff of the change it proposes to existing ones. Files that already exist are never
 * overwritten wholesale.
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { init } from "../src/cli/init.ts";
import { migrate } from "../src/cli/migrate.ts";
import { runWorkarounds } from "../src/cli/workarounds.ts";

const [cmd, ...rest] = process.argv.slice(2);
const write = rest.includes("--write");
const strict = rest.includes("--strict");
const flag = (name: string) => {
	const i = rest.indexOf(`--${name}`);
	return i >= 0 ? rest[i + 1] : undefined;
};
const valueFlags = ["dir", "theme", "mark", "out", "base", "manifest", "name", "short-name"];
const isFlagValue = (i: number) => valueFlags.some((f) => rest[i - 1] === `--${f}`);
const args = rest.filter((a, i) => !a.startsWith("--") && !isFlagValue(i));

const HELP = `codeatlas-ui <command>

  init     Wire @codeatlasdev/ui into a SvelteKit or Astro project
  migrate  Rewrite code for renamed APIs (see the changelog)
  brand    Render the brand icons and src/generated/brand.ts without a Vite run (type-check jobs)
  workarounds  List the ca-ui-workaround(#n) markers in src and which issues are closed (read-only)

Options:
  --write      create the missing files and apply the proposed changes (without it init only reports)
  --strict     migrate: exit 1 when a usage was left for you to finish
  --dir <p>    project directory (init, brand; default: cwd)

brand options (same as caBrandPlugin): --theme <file exporting theme> --mark <svg>
  --out <dir> --base <url> --manifest <file> --name <text> --short-name <text>
`;

if (cmd === "init") {
	const root = resolve(flag("dir") ?? process.cwd());
	process.exit(init(root, { write }) ? 0 : 1);
} else if (cmd === "migrate") {
	const targets = args.length ? args : ["src"];
	const files = targets.flatMap((t) => collect(resolve(t)));
	process.exit(migrate(files, { write, strict, cwd: process.cwd() }) ? 0 : 1);
} else if (cmd === "workarounds") {
	process.exit(await runWorkarounds(args.length ? args : ["src"]));
} else if (cmd === "brand") {
	const root = resolve(flag("dir") ?? process.cwd());
	// Lazy: only `brand` needs the renderer (native resvg); init/migrate start without it.
	const { runBrandCommand } = await import("../src/cli/brand.ts");
	process.exit(
		await runBrandCommand(root, {
			theme: flag("theme"),
			mark: flag("mark"),
			outDir: flag("out"),
			base: flag("base"),
			manifestFile: flag("manifest"),
			name: flag("name"),
			shortName: flag("short-name"),
		})
	);
} else {
	process.stdout.write(HELP);
	process.exit(cmd === "--help" || cmd === "-h" || !cmd ? 0 : 1);
}

function collect(path: string): string[] {
	if (!existsSync(path)) return [];
	if (statSync(path).isFile()) return [path];
	return readdirSync(path, { withFileTypes: true }).flatMap((e) =>
		e.name === "node_modules" || e.name.startsWith(".")
			? []
			: e.isDirectory()
				? collect(join(path, e.name))
				: /\.(svelte|ts|js|astro|mdx)$/.test(e.name)
					? [join(path, e.name)]
					: []
	);
}
