/** Inserts `markup` right after the opening `<head>` tag (with or without attributes). Idempotent. */
export function headFirst(html: string, markup: string): string {
	if (!markup || html.includes(markup)) return html;
	return html.replace(/<head(\s[^>]*)?>/i, (open) => `${open}${markup}`);
}
