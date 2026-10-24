import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const made = new Set<string>();

/**
 * A fresh temp directory. A file that calls it also calls `afterAll(cleanTmp)`; bun shares one
 * module instance across test files, so an `afterAll` here would fire once per run instead of once
 * per file (#529: raw `mkdtempSync(join(tmpdir(), …))` left 51k directories in $TMPDIR).
 */
export function tmpDir(prefix: string): string {
	const dir = mkdtempSync(join(tmpdir(), prefix));
	made.add(dir);
	return dir;
}

export function cleanTmp(): void {
	for (const dir of made) rmSync(dir, { recursive: true, force: true });
	made.clear();
}
