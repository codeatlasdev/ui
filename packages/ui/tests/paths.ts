import { fileURLToPath } from "node:url";

/**
 * Portable path helpers for unit tests. Windows hands out backslash paths (`path.join`,
 * `fileURLToPath`) while the TypeScript compiler host and test titles use forward slashes, and
 * `new URL(x).pathname` yields `/F:/…`, which no `fs` call accepts. Go through these instead.
 */

/** Filesystem path of a `file:` URL (`fileURLToPath`, never `URL.pathname`). */
export const pathOf = (rel: string, base: string | URL): string =>
	fileURLToPath(new URL(rel, base));

/** Forward-slash form of a path; the shape the TypeScript compiler host and test titles use. */
export const toPosix = (p: string): string => p.replaceAll("\\", "/");

/** Whether two paths name the same file regardless of separator style. */
export const samePath = (a: string, b: string): boolean => toPosix(a) === toPosix(b);

/** `file` relative to `dir`, forward-slash separated. Both must use the same separator style. */
export const relativeTo = (dir: string, file: string): string => {
	const d = toPosix(dir).replace(/\/?$/, "/");
	const f = toPosix(file);
	return f.startsWith(d) ? f.slice(d.length) : f;
};
