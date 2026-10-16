/** What a motion demo receives from `MotionStage`. Demos render from this and never run their own timers. */
export interface MotionCtx {
	/** True while autoplay is running (in view, tab visible, not paused, not taken over). */
	playing: boolean;
	/** `prefers-reduced-motion: reduce`: render the final state, no animation. */
	reduced: boolean;
	/** The user touched the demo: stop autoplay, keep the demo interactive, show Replay. */
	takeover(): void;
	/** Start (or resume) autoplay and clear a takeover. */
	play(): void;
	/** Stop autoplay without a takeover. */
	pause(): void;
	/** Increments on every autoplay loop and on Replay; key an animation on it to re-run. */
	cycle: number;
}

export interface StageOptions {
	isReduced: () => boolean;
}

/**
 * The state machine behind `MotionStage`: autoplay is allowed only while the stage is in view,
 * the tab is visible, the user did not pause and did not take over. Timers live in the component;
 * this holds the flags.
 */
export function createStage(opts: StageOptions) {
	let inView = $state(false);
	let hidden = $state(false);
	let paused = $state(false);
	let taken = $state(false);
	let cycle = $state(0);

	const reduced = $derived(opts.isReduced());
	const playing = $derived(inView && !hidden && !paused && !taken && !reduced);

	const ctx: MotionCtx = {
		get playing() {
			return playing;
		},
		get reduced() {
			return reduced;
		},
		get cycle() {
			return cycle;
		},
		takeover() {
			taken = true;
		},
		play() {
			taken = false;
			paused = false;
			cycle += 1;
		},
		pause() {
			paused = true;
		},
	};

	return {
		ctx,
		get taken() {
			return taken;
		},
		setInView(v: boolean) {
			if (v && !inView && !reduced) cycle += 1;
			inView = v;
		},
		setHidden(v: boolean) {
			hidden = v;
		},
		/** One autoplay tick. */
		tick() {
			if (playing) cycle += 1;
		},
		/** Pause toggle: resuming after a pause or a takeover also counts as a replay. */
		toggle() {
			if (paused || taken) ctx.play();
			else ctx.pause();
		},
	};
}
