// Pure helpers for the Code panel. DOM-free so they can be unit tested.

/**
 * Pull a Theme Studio share code (`v1.xxxx`) out of what a visitor pasted: a full URL with
 * `#t=v1.xxxx`, a bare `#t=` / `t=` fragment, or the code alone. Whitespace is ignored.
 * Returns null when no code is found.
 */
export function extractCode(input: string): string | null {
	const text = input.trim();
	if (!text) return null;
	const m = /(?:^|[#?&\s])(?:t=)?(v\d+\.[\w-]+)\s*$/.exec(text);
	return m ? (m[1] as string) : null;
}
