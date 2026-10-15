import { createRequire } from "node:module";
import { join } from "node:path";
import type * as TS from "typescript";

export type TypeScript = typeof TS;

export const MISSING_TYPESCRIPT = "migrate needs typescript (bun add -d typescript)";

/**
 * `typescript` is an optional peer that the codemod parses with. It is looked up in the
 * project first (`bunx` runs the CLI from a cache directory that cannot see the project's
 * node_modules), then next to the CLI. `null` when neither has it.
 */
export function loadTypescript(cwd: string): TypeScript | null {
	for (const from of [join(cwd, "noop.js"), import.meta.url]) {
		try {
			return createRequire(from)("typescript") as TypeScript;
		} catch {}
	}
	return null;
}
