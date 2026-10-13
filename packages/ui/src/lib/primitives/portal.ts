/**
 * Svelte attachment: moves the node to `document.body` (or `target`) and removes it on destroy.
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
			// Svelte only removes the nodes it placed: a portaled node has left its range, so destroying
			// the branch must remove it here (restoring it would resurrect the node in the old spot).
			node.remove();
			marker.remove();
		};
	};
}
