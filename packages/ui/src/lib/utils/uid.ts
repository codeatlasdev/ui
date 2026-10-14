// ─── uid utility ──────────────────────────────────────────────────────────────
/** Short random id `"<prefix>-xxxxxxx"` for DOM ids and keys. Not cryptographically secure. */
export function uid(prefix = "ca"): string {
	return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
