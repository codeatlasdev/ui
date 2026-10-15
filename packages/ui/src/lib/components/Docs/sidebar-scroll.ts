/**
 * Docs sidebar position across page loads. On a static docs site every link loads a new document,
 * so DocsShell saves the sidebar scroll before leaving and restores it on the next page.
 *
 * `restoreSidebar` is also inlined right after the sidebar markup (see `sidebarScript`), so the
 * position is back before the first paint instead of jumping on hydration. Keep it self-contained:
 * no imports, no references outside its body.
 */
export function restoreSidebar(aside: HTMLElement, key: string): void {
	try {
		const saved = sessionStorage.getItem(key);
		// Not on a sidebar the inline script (or the reader) already moved.
		if (saved !== null && aside.scrollTop === 0) aside.scrollTop = Number(saved);
	} catch {}
	// The current page stays in view: centred in the sidebar when it is outside it. Scrolls only
	// the sidebar (never the window, unlike scrollIntoView) and never moves focus.
	const current = aside.querySelector('[aria-current="page"]');
	if (!current || !aside.clientHeight) return;
	const box = aside.getBoundingClientRect();
	const rect = current.getBoundingClientRect();
	if (rect.top < box.top || rect.bottom > box.bottom)
		aside.scrollTop += rect.top - box.top - (box.height - rect.height) / 2;
}

export function saveSidebar(aside: HTMLElement, key: string): void {
	try {
		sessionStorage.setItem(key, String(Math.round(aside.scrollTop)));
	} catch {}
}

/**
 * Inline script tag placed right after the sidebar element in the server markup. Built here, not
 * in DocsShell's markup: Vite's dependency scan would read a `<script>` there as a script block
 * (tests/svelte-script-tags.test.ts).
 */
export function sidebarScript(key: string): string {
	const arg = JSON.stringify(key).replace(/</g, "\\u003c");
	const body = `(${restoreSidebar})(document.currentScript.previousElementSibling,${arg})`;
	return `<script>${body}</script>`;
}
