import { devWarn } from "./dev-warn.js";

/**
 * Dev-only: after mount, warn once when a page-level layout (PageShell, PageFrame) sits in a page
 * with no `<main>` landmark (no `main`/`[role=main]` ancestor and none anywhere in the document).
 * Shells that render their own `<main>` (AppShellLayout, AuthLayout, DocsShell) or a page that owns
 * one stay silent. Call it from an `$effect`; `devWarn` makes it a no-op in production builds.
 */
export function warnNoMain(el: Element | undefined, component: string): void {
	if (!el || el.closest("main, [role=main]") || document.querySelector("main, [role=main]")) return;
	devWarn(
		"no-main-landmark",
		`<${component}> is not inside a <main> landmark and the page has none (axe landmark-one-main). Wrap the page in <main id="main">, or follow the "Standalone page" recipe: https://ui.codeatlas.com.br/docs/getting-started/recipes/#standalone-page`
	);
}
