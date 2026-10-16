// ─── pendingLink: `data-pending` on the link being navigated to ────────────────

import type { Attachment } from "svelte/attachments";
import { navigating } from "$app/state";

/**
 * Attachment for `<a>`: while SvelteKit navigates to this link's `href`, it carries
 * `data-pending` and `aria-busy="true"`, so the link the user tapped can show its own
 * loading state (`a[data-pending] { opacity: .6 }`) before the next page is ready.
 *
 * @example
 * ```svelte
 * <script>
 *   import { pendingLink } from '@codeatlasdev/ui/kit';
 * </script>
 * <a href="/billing" {@attach pendingLink()}>Billing</a>
 * ```
 */
export function pendingLink(): Attachment<HTMLAnchorElement> {
	return (node) => {
		$effect(() => {
			const to = navigating.to?.url;
			const pending = !!to && to.pathname === new URL(node.href, to).pathname;
			node.toggleAttribute("data-pending", pending);
			if (pending) node.setAttribute("aria-busy", "true");
			else node.removeAttribute("aria-busy");
		});
		return () => {
			node.removeAttribute("data-pending");
			node.removeAttribute("aria-busy");
		};
	};
}
