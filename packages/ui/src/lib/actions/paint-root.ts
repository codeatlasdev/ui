/**
 * Makes the page's `<html>` background (the overscroll area, the iOS/Android toolbar tint) match a
 * NESTED preset. `<html>` owns the page preset through `colorScheme`, so while a public screen
 * wrapped in `data-preset="x"` (or `data-theme-scope`) is mounted, the root would keep painting the
 * page's own surface. The action copies the island's resolved `--ca-surface-base` to
 * `--ca-root-surface` on `<html>` (read by `base.css`) and removes it on destroy, so the preset's
 * color is never duplicated in the app. It follows scheme and preset changes on `<html>`.
 *
 *   <div data-preset="ocean" use:paintRoot>…</div>
 */
export function paintRoot(node: HTMLElement) {
	const root = document.documentElement;
	const apply = () => {
		// A probe resolves var()/color-mix to a concrete color in the island's own cascade.
		const probe = document.createElement("span");
		probe.style.cssText =
			"position:absolute;visibility:hidden;background-color:var(--ca-surface-base)";
		node.appendChild(probe);
		const color = getComputedStyle(probe).backgroundColor;
		probe.remove();
		root.style.setProperty("--ca-root-surface", color);
	};
	apply();
	const mo = new MutationObserver(apply);
	mo.observe(root, { attributes: true, attributeFilter: ["class", "data-preset", "data-style"] });
	return {
		update: apply,
		destroy() {
			mo.disconnect();
			root.style.removeProperty("--ca-root-surface");
		},
	};
}
