// ─── useBreadcrumbs — SvelteKit-aware breadcrumb state ─────────────────────────

import { toStore } from "svelte/store";
// $app/state works on Kit >=2.12 and Kit 3 ($app/stores was removed in Kit 3).
import { page } from "$app/state";
import type { BreadcrumbItem } from "../components/Breadcrumb/Breadcrumb.svelte";
import { useT } from "../i18n/state.svelte.js";

/**
 * Returns a reactive `BreadcrumbItem[]` derived from the current SvelteKit
 * route path. Mount `<Breadcrumb items={breadcrumbs} />` in your layout.
 *
 * @example
 * ```svelte
 * <script>
 *   import { useBreadcrumbs } from '@codeatlasdev/ui/kit';
 *   import { Breadcrumb } from '@codeatlasdev/ui';
 *   const breadcrumbs = useBreadcrumbs();
 * </script>
 * <Breadcrumb items={$breadcrumbs} />
 * ```
 */
export function useBreadcrumbs() {
	const t = useT();
	return toStore(() => {
		const segments = page.url.pathname.split("/").filter(Boolean);
		const items: BreadcrumbItem[] = [
			{ label: t().breadcrumb.home, href: "/" },
			...segments.map((seg, i) => ({
				label: seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
				href: i < segments.length - 1 ? `/${segments.slice(0, i + 1).join("/")}` : undefined,
			})),
		];
		return items;
	});
}
