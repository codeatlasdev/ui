// ─── Shiki highlighter singleton ─────────────────────────────────────────────
import type { Highlighter } from "shiki";

let _promise: Promise<Highlighter> | null = null;

export function getHighlighter(): Promise<Highlighter> {
	if (!_promise) {
		_promise = import("shiki").then(({ createHighlighter }) =>
			createHighlighter({
				themes: ["github-dark-high-contrast", "github-light-high-contrast"],
				langs: ["svelte", "typescript", "javascript", "css", "html", "bash", "json", "sh"],
			})
		);
	}
	return _promise;
}

/** Both themes as `--shiki-light` / `--shiki-dark`; CSS picks one with `light-dark()` (no re-highlight on a scheme change). */
const THEMES = { light: "github-light-high-contrast", dark: "github-dark-high-contrast" } as const;

/**
 * Highlighted HTML of `code`. A language the singleton did not preload is loaded on demand when shiki bundles
 * it (`markdown`, `yaml`, ...); one it does not know falls back to plain text, still inside the highlighted
 * block, so the caller never keeps showing its unhighlighted fallback.
 */
export async function highlight(code: string, language: string): Promise<string> {
	const hl = await getHighlighter();
	let lang = language;
	if (!hl.getLoadedLanguages().includes(lang)) {
		const { bundledLanguages } = await import("shiki");
		if (lang in bundledLanguages) await hl.loadLanguage(lang as keyof typeof bundledLanguages);
		else lang = "text";
	}
	return hl.codeToHtml(code, { lang, themes: THEMES, defaultColor: false });
}
