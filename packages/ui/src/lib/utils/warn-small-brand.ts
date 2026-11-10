import { devWarn } from "./dev-warn.js";

/**
 * Dev-only: after mount, warn once when the shell's `brand` snippet holds an interactive element
 * (a link or button) smaller than `--ca-touch-target` on a coarse pointer. Set `brandHref` instead:
 * the shell then owns the link and its 44px hit area. A no-op in production builds.
 */
export function warnSmallBrand(wrappers: Iterable<Element | null | undefined>): void {
	if (typeof matchMedia === "undefined" || !matchMedia("(pointer: coarse)").matches) return;
	const probe = document.createElement("div");
	probe.style.cssText = "position:absolute;visibility:hidden;width:var(--ca-touch-target)";
	document.body.append(probe);
	const min = probe.getBoundingClientRect().width;
	probe.remove();
	for (const wrapper of wrappers) {
		const el = wrapper?.querySelector<HTMLElement>("a[href], button");
		if (!el || el.closest(".ca-shell-brand")) continue;
		const r = el.getBoundingClientRect();
		if (r.width === 0 || r.height === 0) continue;
		if (r.width < min || r.height < min) {
			devWarn(
				"small-shell-brand",
				`The AppShellLayout \`brand\` snippet holds a link or button of ${Math.round(r.width)}x${Math.round(r.height)}px, under the ${Math.round(min)}px touch target. Set \`brandHref\` and \`brandLabel\` on AppShellLayout instead: the shell then owns the link and its hit area.`
			);
			return;
		}
	}
}
