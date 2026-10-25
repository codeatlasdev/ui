/**
 * The key of a cached result: a sha256 over the BYTES of every input as it is on disk right now, uncommitted edits
 * included. Not a git object id (an edit nobody committed has none, and two worktrees would share the id of the
 * committed file), not a file time (a rebase rewrites them). The path of each file is hashed with its bytes, so
 * adding, removing or renaming a file changes the key even when the total size does not.
 *
 *   contentKey(root, ["src", "bun.lock"], ["bun 1.4.4"])   -> 64 hex chars
 *
 * `inputs` are files or directories relative to `root`, directories walked in name order; `extra` carries what is
 * not on disk (tool versions). A missing input is part of the key (its name, marked absent), never an error.
 * `node_modules`, test artifacts and editor noise are skipped: they are outputs, not inputs.
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const SKIP: Record<string, true> = {
	node_modules: true,
	__screenshots__: true,
	__traces__: true,
	".vitest": true,
	".DS_Store": true,
	".git": true,
};

function* walk(path: string): Generator<string> {
	if (!statSync(path).isDirectory()) return yield path;
	for (const name of readdirSync(path).sort())
		if (!Object.hasOwn(SKIP, name)) yield* walk(join(path, name));
}

export function contentKey(root: string, inputs: string[], extra: string[] = []): string {
	const hash = createHash("sha256");
	for (const input of [...inputs].sort()) {
		const path = join(root, input);
		if (!existsSync(path)) {
			hash.update(`absent\0${input}\0`);
			continue;
		}
		for (const file of walk(path)) {
			hash.update(`${relative(root, file)}\0`);
			hash.update(readFileSync(file));
			hash.update("\0");
		}
	}
	for (const e of extra) hash.update(`extra\0${e}\0`);
	return hash.digest("hex");
}

/** Whether the stamp a build left holds `key`; false when there is no stamp. */
export function upToDate(stampFile: string, key: string): boolean {
	return existsSync(stampFile) && readFileSync(stampFile, "utf8") === key;
}
