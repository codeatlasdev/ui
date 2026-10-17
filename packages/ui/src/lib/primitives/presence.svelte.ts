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
	// The `{#if present}` block re-reads `present` in the same flush that flips `open`, before the
	// pre-effect below can raise `exiting`: without a bridge the node is destroyed with no exit.
	// `armed` is that bridge: set while open, spent when the pre-effect takes the close over.
	let armed = false;
	// A derived, so an effect reading `present` re-runs when its value changes and not on every flip
	// of `open`: a layer must not be torn down and reopened (a hosted menu is moved out of its dialog
	// and back) just because its exit started.
	const present = $derived(getOpen() || exiting || (armed && node !== null));

	function runningAnimations(el: HTMLElement): Animation[] {
		return el.getAnimations({ subtree: true }).filter((a) => a.playState === "running");
	}

	$effect.pre(() => {
		const open = getOpen();
		if (open) {
			exiting = false;
			armed = true;
			token++;
			return;
		}
		armed = false;
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
			return present;
		},
		ref(el) {
			node = el;
			return () => {
				if (node === el) node = null;
			};
		},
	};
}
