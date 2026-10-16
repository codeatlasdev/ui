/** `?pick=012,045` → known ids only, deduplicated, in the order given. */
export function parsePicks(raw: string | null, known: ReadonlySet<string>): string[] {
	if (!raw) return [];
	const ids = raw
		.split(",")
		.map((s) => s.trim().replace(/^#/, ""))
		.filter((id) => known.has(id));
	return [...new Set(ids)];
}

/** The exact text the "Copy picks" button writes. */
export function copyText(picks: { id: string; title: string }[]): string {
	return [
		`I picked these ${picks.length} from the @codeatlasdev/ui gallery:`,
		...picks.map((p) => `#${p.id} ${p.title}`),
	].join("\n");
}

/**
 * `?cb=` is where "Send to AI" navigates. Only a local listener is legitimate (the pick CLI binds
 * 127.0.0.1), so anything else is dropped: a crafted gallery link must never become an open redirect.
 */
export function safeCallback(raw: string | null): string | null {
	if (!raw) return null;
	try {
		const url = new URL(raw);
		const local = url.hostname === "127.0.0.1" || url.hostname === "localhost";
		return (url.protocol === "http:" || url.protocol === "https:") &&
			local &&
			!url.username &&
			!url.password
			? url.href
			: null;
	} catch {
		return null;
	}
}
