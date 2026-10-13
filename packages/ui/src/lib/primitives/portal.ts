/**
 * Svelte attachment: moves the node to `document.body` (or `target`) and puts it back on destroy.
 * `false` leaves it in place. No-op during SSR (attachments only run in the browser).
 *
 *   <div {@attach portal()}>…</div>
 */
export function portal(target?: string | HTMLElement | false) {
	return (node: HTMLElement): (() => void) => {
		if (target === false || typeof document === "undefined") return () => {};
		const dest = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
		const parent = node.parentNode;
		const marker = document.createComment("ca-portal");
		parent?.insertBefore(marker, node);
		(dest ?? document.body).appendChild(node);
		return () => {
			// Svelte does not remove a portaled node when its host unmounts; re-inserting it at
			// the marker would resurrect it, so cleanup always removes it.
			node.remove();
			marker.remove();
		};
	};
}
