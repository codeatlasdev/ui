/**
 * Inserts `markup` at the start of `<head>` (with or without attributes). Idempotent. When the head opens
 * with `<meta charset>`, the markup goes right after it: the charset must sit in the first 1024 bytes, and
 * the theme `<style>` is several KB (#926).
 */
export function headFirst(html: string, markup: string): string {
	if (!markup || html.includes(markup)) return html;
	return html.replace(
		/<head(?:\s[^>]*)?>(?:\s*<meta\s+charset=[^>]*>)?/i,
		(open) => `${open}${markup}`
	);
}
