import { relative, sep } from "node:path";

/**
 * `relative(from, to)` with `/` on every OS (#1243). Reports print it, and allow-lists, configs and tests compare
 * it with `src/a.svelte`; Windows' `src\a.svelte` matched none of them. File-system calls keep native paths.
 */
export const relPosix = (from: string, to: string): string =>
	relative(from, to).split(sep).join("/");
