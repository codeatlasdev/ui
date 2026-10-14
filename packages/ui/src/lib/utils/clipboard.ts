// ─── Clipboard utility ────────────────────────────────────────────────────────

/** Copies `text` with the Clipboard API, falling back to `execCommand("copy")`. Resolves `true` on success. */
export async function copyToClipboard(text: string): Promise<boolean> {
	try {
		if (navigator?.clipboard?.writeText) {
			await navigator.clipboard.writeText(text);
			return true;
		}
		// Fallback for older browsers
		const el = document.createElement("textarea");
		el.value = text;
		el.style.cssText = "position:fixed;top:-9999px";
		document.body.appendChild(el);
		el.select();
		const ok = document.execCommand("copy");
		document.body.removeChild(el);
		return ok;
	} catch {
		return false;
	}
}
