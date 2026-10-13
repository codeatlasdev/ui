#!/usr/bin/env node
/**
 * codeatlas-ui: project setup and migration.
 *
 *   bunx @codeatlasdev/ui init [--write] [--dir <path>]
 *   bunx @codeatlasdev/ui migrate [--write] [paths...]
 *
 * `init` creates missing files. Files that already exist are never overwritten:
 * the CLI prints a unified diff of the change it proposes, and `--write` applies it.
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { init } from "../src/cli/init.ts";
import { migrate } from "../src/cli/migrate.ts";

const [cmd, ...rest] = process.argv.slice(2);
const write = rest.includes("--write");
const dirFlag = rest.indexOf("--dir");
const args = rest.filter((a, i) => !a.startsWith("--") && i !== dirFlag + 1);

const HELP = `codeatlas-ui <command>

  init     Wire @codeatlasdev/ui into a SvelteKit or Astro project
  migrate  Rewrite code for renamed APIs (see the changelog)

Options:
  --write      apply proposed changes to existing files (new files are always created)
  --dir <p>    project directory (init, default: cwd)
`;

if (cmd === "init") {
	const root = resolve(dirFlag >= 0 ? rest[dirFlag + 1] : process.cwd());
	process.exit(init(root, { write }) ? 0 : 1);
} else if (cmd === "migrate") {
	const targets = args.length ? args : ["src"];
	const files = targets.flatMap((t) => collect(resolve(t)));
	process.exit(migrate(files, { write, cwd: process.cwd() }) ? 0 : 1);
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
