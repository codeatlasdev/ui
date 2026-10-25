// ─── soundBus: the only sound code in core ────────────────────────────────────
// Components announce what happened (`soundBus.emit("press")`); nothing in core can play audio.
// The optional entry `@codeatlasdev/ui/sound` registers the one listener, so without it every
// emit is a call on `undefined` guarded away: no engine, no AudioContext, no bytes.

/** Semantic cue names. Actions, not components: `press` is any button, `tab` any tab change. */
export type CueName =
	| "press"
	| "release"
	| "tap"
	| "toggle-on"
	| "toggle-off"
	| "select"
	| "check"
	| "success"
	| "error"
	| "warning"
	| "notify"
	| "open"
	| "close"
	| "forward"
	| "back"
	| "tab"
	| "tick"
	| "hover";

/** What a component's `sound` prop accepts: `true` plays the component's own cue, a name overrides it. */
export type SoundProp = boolean | CueName;

type Listener = (cue: CueName) => void;

let listener: Listener | undefined;

export const soundBus = {
	/** Announce a cue. A no-op until `@codeatlasdev/ui/sound` is imported and enabled. */
	emit(cue: CueName): void {
		listener?.(cue);
	},
	/** Registers the single engine listener. Returns the unsubscribe. Used by the sound entry only. */
	listen(fn: Listener): () => void {
		listener = fn;
		return () => {
			if (listener === fn) listener = undefined;
		};
	},
};

/** The cue a component plays for its `sound` prop: `fallback` for `true`, the name itself for a name, nothing for `false`. */
export function cueFor(prop: SoundProp | undefined, fallback: CueName): CueName | undefined {
	return prop === true ? fallback : prop || undefined;
}
