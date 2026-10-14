import { getContext, setContext } from "svelte";
import type { HeadingLevel } from "../../types.js";

const KEY = Symbol("ca-heading-level");

/** PageShell renders the page `<h1>`, so section titles inside it start at `<h2>`. */
export function provideSectionHeadingLevel(level: HeadingLevel = 2) {
	setContext(KEY, level);
}

/** Level a title should use when the caller did not set one: the page's section level, else `fallback`. */
export function sectionHeadingLevel(fallback: HeadingLevel): HeadingLevel {
	return getContext<HeadingLevel | undefined>(KEY) ?? fallback;
}
