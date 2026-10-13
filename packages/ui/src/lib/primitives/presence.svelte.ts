/**
 * Keeps content mounted while it plays its exit animation.
 * `present` is true while `getOpen()` is true, and after it turns false for as long as the
 * node (or a descendant) has running CSS/WAAPI animations. With no animation (or reduced
 * motion collapsing them to zero) it drops immediately. The caller sets `data-state`.
 *
 *   const p = createPresence(() => open);
 *   {#if p.present}<div {@attach p.ref} data-state={open ? "open" : "closed"}>…</div>{/if}
 */
export interface Presence {
	readonly present: boolean;
	/** Attachment / action: registers the element whose animations gate unmounting. */
	ref(node: HTMLElement): () => void;
}

export function createPresence(getOpen: () => boolean): Presence {
	let node: HTMLElement | null = null;
	let exiting = $state(false);
	let token = 0;

	function runningAnimations(el: HTMLElement): Animation[] {
		return el.getAnimations({ subtree: true }).filter((a) => a.playState === "running");
	}

	$effect.pre(() => {
		const open = getOpen();
		if (open) {
			exiting = false;
			token++;
			return;
		}
		const el = node;
		if (!el) return;
		const mine = ++token;
		// The caller flips `data-state="closed"` in the same flush; wait one frame so the
		// exit animation has been created before we look for it.
		exiting = true;
		const frame = requestAnimationFrame(() => {
			if (mine !== token) return;
			const anims = runningAnimations(el);
			if (anims.length === 0) {
				exiting = false;
				return;
			}
			Promise.allSettled(anims.map((a) => a.finished)).then(() => {
				if (mine === token) exiting = false;
			});
		});
		return () => cancelAnimationFrame(frame);
	});

	return {
		get present() {
			return getOpen() || exiting;
		},
		ref(el) {
			node = el;
			return () => {
				if (node === el) node = null;
			};
		},
	};
}
