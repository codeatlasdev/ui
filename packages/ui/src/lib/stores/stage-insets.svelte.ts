// ─── Stage insets: the part of the stage a PageFrame covers ──────────────────
// A map-first app has a live stage (map, canvas) behind the page content. A PageFrame floats a
// panel over it; the stage has to keep pins, routes and `fitBounds` clear of that panel. The frame
// publishes the rectangle it covers, in px from each edge of the stage, and the stage reads it:
//   map.fitBounds(bounds, { padding: stageInsets.current })
// or, without JS, from `--ca-stage-inset-{top,right,bottom,left}` on <html>.

export interface StageInsets {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

const SIDES = ["top", "right", "bottom", "left"] as const;
const zero = (): StageInsets => ({ top: 0, right: 0, bottom: 0, left: 0 });

function createStageInsetsStore() {
	let current = $state<StageInsets>(zero());
	/** Publishers in order of arrival. The newest one is active; when it leaves, the previous one takes over. */
	const stack: { key: symbol; rect: StageInsets }[] = [];

	function apply() {
		const top = stack.at(-1)?.rect ?? zero();
		current = { ...top };
		if (typeof document === "undefined") return;
		const style = document.documentElement.style;
		for (const side of SIDES) {
			if (stack.length === 0) style.removeProperty(`--ca-stage-inset-${side}`);
			else style.setProperty(`--ca-stage-inset-${side}`, `${top[side]}px`);
		}
	}

	return {
		/** Reactive `{ top, right, bottom, left }` in px covered by the active frame; all 0 when none is mounted. */
		get current(): StageInsets {
			return current;
		},
		/** Publishes `rect` for `key`, rounded to whole px. A new key becomes the active publisher; an older key's later updates are stored but do not show until it is on top again. */
		set(key: symbol, rect: StageInsets) {
			const rounded = {
				top: Math.round(rect.top),
				right: Math.round(rect.right),
				bottom: Math.round(rect.bottom),
				left: Math.round(rect.left),
			};
			const at = stack.findIndex((e) => e.key === key);
			if (at >= 0) stack[at].rect = rounded;
			else stack.push({ key, rect: rounded });
			apply();
		},
		/** Releases `key`; the previous publisher (if any) becomes active again. */
		clear(key: symbol) {
			const at = stack.findIndex((e) => e.key === key);
			if (at < 0) return;
			stack.splice(at, 1);
			apply();
		},
		/** Drops every publisher (tests, hot reload). */
		reset() {
			stack.length = 0;
			apply();
		},
	};
}

/** The rectangle the active `PageFrame` covers over the stage, in px from each stage edge. `stageInsets.current` is reactive and mirrored to `--ca-stage-inset-*` on `<html>`. */
export const stageInsets = createStageInsetsStore();
