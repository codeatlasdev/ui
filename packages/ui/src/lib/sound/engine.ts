// ─── Sound engine: one lazy AudioContext, every cue synthesized ───────────────
// Principles enforced here (see the Sound guide): off by default, no AudioContext before a user
// gesture, short and quiet (master gain 0.25, a compressor stops stacked cues clipping), reduced
// motion drops hover and tick cues, silent while the tab is hidden or a <video>/<audio> plays,
// one cue per name per 40 ms and at most 4 voices (the oldest is stolen).

import type { Action } from "svelte/action";
import { type CueName, soundBus } from "../utils/sound-bus.js";
import { MOTION_CUES, profileFor, type SoundProfile } from "./profiles.js";

const KEY = "ca-sound";
const MAX_VOICES = 4;
const THROTTLE_MS = 40;
const ROOT_SEMITONE = 2 ** (1 / 12);

interface Stored {
	enabled: boolean;
	volume: number;
}

/** A cue as a list of notes: semitones above the root, in order, plus the note envelope. */
interface Shape {
	notes: number[];
	/** Note length in ms before the profile's `len`. */
	ms: number;
	/** Noise burst instead of (or under) the pitch. */
	click?: boolean;
	/** Pitch slides to this many semitones over the note (sweeps). */
	slide?: number;
	/** Gain of the cue relative to the profile. */
	vol?: number;
}

const SHAPES: Record<CueName, Shape> = {
	press: { notes: [0], ms: 30, click: true },
	release: { notes: [4], ms: 24, click: true, vol: 0.6 },
	tap: { notes: [7], ms: 22, click: true, vol: 0.7 },
	"toggle-on": { notes: [0, 7], ms: 60 },
	"toggle-off": { notes: [7, 0], ms: 60 },
	select: { notes: [4], ms: 50 },
	check: { notes: [0, 4], ms: 50 },
	success: { notes: [0, 4, 7], ms: 70 },
	error: { notes: [-12, -13], ms: 110, vol: 1.1 },
	warning: { notes: [0, 0], ms: 90 },
	notify: { notes: [7, 12], ms: 80 },
	open: { notes: [0], ms: 150, slide: 12 },
	close: { notes: [12], ms: 130, slide: -12 },
	forward: { notes: [2, 7], ms: 60 },
	back: { notes: [7, 2], ms: 60 },
	tab: { notes: [5], ms: 35, vol: 0.8 },
	tick: { notes: [12], ms: 14, click: true, vol: 0.3 },
	hover: { notes: [14], ms: 12, vol: 0.12 },
};

const subs = new Set<() => void>();
const lastPlayed: Partial<Record<CueName, number>> = {};
let ctx: AudioContext | undefined;
let master: GainNode | undefined;
let noise: AudioBuffer | undefined;
let voices: { stop(): void; end: number }[] = [];
let disarm: (() => void) | undefined;
let state: Stored = { enabled: false, volume: 0.25 };
let forced: SoundProfile | undefined;
let unsubscribeBus: (() => void) | undefined;

try {
	const raw = JSON.parse(localStorage.getItem(KEY) ?? "null");
	if (raw && typeof raw === "object")
		state = {
			enabled: raw.enabled === true,
			volume: Math.min(1, Math.max(0, Number(raw.volume ?? 0.25))) || 0,
		};
} catch {}

const notify = () => {
	for (const f of subs) f();
};

function save() {
	try {
		localStorage.setItem(KEY, JSON.stringify(state));
	} catch {}
	notify();
}

/** The AudioContext is created here and only here, inside the first pointer or key event. */
function unlock() {
	if (ctx || !state.enabled) return;
	if (!window.AudioContext) return;
	ctx = new AudioContext();
	master = ctx.createGain();
	master.gain.value = state.volume;
	const limiter = ctx.createDynamicsCompressor();
	master.connect(limiter).connect(ctx.destination);
	ctx.resume().catch(() => {});
}

function arm() {
	if (disarm || ctx || typeof document === "undefined") return;
	const go = () => {
		disarm?.();
		unlock();
	};
	disarm = () => {
		disarm = undefined;
		document.removeEventListener("pointerdown", go, true);
		document.removeEventListener("keydown", go, true);
	};
	document.addEventListener("pointerdown", go, true);
	document.addEventListener("keydown", go, true);
}

const mediaPlaying = () =>
	[...document.querySelectorAll<HTMLMediaElement>("video,audio")].some((m) => !m.paused);

/** `--ca-sound-<name>` as a number (author override), else `fallback`. */
function token(name: string, fallback: number): number {
	const v = Number.parseFloat(
		getComputedStyle(document.documentElement).getPropertyValue(`--ca-sound-${name}`)
	);
	return Number.isFinite(v) ? v : fallback;
}

/** The profile in force: the one set with `use()`, `--ca-sound-profile`, or the one that fits `<html data-style>`. */
function current(): SoundProfile {
	if (forced) return forced;
	const html = document.documentElement;
	const named = getComputedStyle(html).getPropertyValue("--ca-sound-profile").trim();
	return profileFor(named || html.dataset.caDesign || html.dataset.style);
}

function render(cue: CueName, p: SoundProfile) {
	if (!ctx || !master) return;
	const c = ctx;
	const s = SHAPES[cue];
	// --ca-sound-pitch multiplies the root, --ca-sound-brightness the filter, --ca-sound-gain the level.
	const root = p.root * token("pitch", 1);
	const dur = (s.ms * p.len) / 1000;
	const level = p.gain * token("gain", 1) * (s.vol ?? 1);
	const out = c.createGain();
	const filter = c.createBiquadFilter();
	filter.frequency.value = p.tone * token("brightness", 1);
	out.connect(filter).connect(master);
	const t0 = c.currentTime;
	const stops: (() => void)[] = [];
	const env = (g: GainNode, at: number, len: number, peak: number) => {
		g.gain.setValueAtTime(0.0001, at);
		g.gain.exponentialRampToValueAtTime(peak, at + 0.004);
		g.gain.exponentialRampToValueAtTime(0.0001, at + len);
	};
	s.notes.forEach((semi, i) => {
		const at = t0 + i * dur;
		const len = dur;
		for (const cents of p.detune ? [-p.detune, p.detune] : [0]) {
			const o = c.createOscillator();
			const g = c.createGain();
			o.type = p.wave;
			o.detune.value = cents;
			const f = root * ROOT_SEMITONE ** semi;
			o.frequency.setValueAtTime(f, at);
			if (s.slide) o.frequency.exponentialRampToValueAtTime(f * ROOT_SEMITONE ** s.slide, at + len);
			env(g, at, len, level * (s.click ? 1 - p.grit * 0.7 : 1) * (p.detune ? 0.5 : 1));
			o.connect(g).connect(out);
			o.start(at);
			o.stop(at + len + 0.02);
			stops.push(() => o.stop());
		}
	});
	if (s.click && p.grit > 0) {
		noise ??= (() => {
			const b = c.createBuffer(1, c.sampleRate / 10, c.sampleRate);
			const d = b.getChannelData(0);
			for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
			return b;
		})();
		const n = c.createBufferSource();
		const g = c.createGain();
		n.buffer = noise;
		env(g, t0, Math.min(dur, 0.04), level * p.grit);
		n.connect(g).connect(out);
		n.start(t0);
		n.stop(t0 + dur + 0.02);
		stops.push(() => n.stop());
	}
	const end = t0 + dur * s.notes.length + 0.03;
	voices.push({
		stop: () => {
			for (const f of stops) f();
		},
		end,
	});
}

const api = {
	/** True once the user turned sound on (persisted). Off by default. */
	get enabled() {
		return state.enabled;
	},
	/** Master volume 0-1 (persisted, default 0.25). */
	get volume() {
		return state.volume;
	},
	/** The profile that is in force right now. */
	get profile(): SoundProfile {
		return typeof document === "undefined" ? profileFor(null) : current();
	},
	/** True once the AudioContext exists, which only happens after the first user gesture. */
	get unlocked() {
		return !!ctx;
	},
	enable(on = true) {
		state = { ...state, enabled: on };
		if (on) arm();
		else if (ctx?.state === "running") ctx.suspend().catch(() => {});
		save();
	},
	setVolume(v: number) {
		state = { ...state, volume: Math.min(1, Math.max(0, v)) };
		if (master) master.gain.value = state.volume;
		save();
	},
	/** Pins a profile (or `undefined` to follow the style again). */
	use(profile: SoundProfile | undefined) {
		forced = profile;
		notify();
	},
	/** Plays a cue. Silent unless sound is on, unlocked, visible and allowed. Returns whether it played. */
	play(cue: CueName): boolean {
		if (!state.enabled || !ctx || !master || typeof document === "undefined") return false;
		if (document.hidden || mediaPlaying()) return false;
		if (MOTION_CUES[cue] && matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
		const p = current();
		if (cue === "hover" && !p.hover) return false;
		const now = performance.now();
		if (now - (lastPlayed[cue] ?? -THROTTLE_MS) < THROTTLE_MS) return false;
		lastPlayed[cue] = now;
		if (ctx.state === "suspended") ctx.resume().catch(() => {});
		const at = ctx.currentTime;
		voices = voices.filter((v) => v.end > at);
		if (voices.length >= MAX_VOICES) voices.shift()?.stop();
		render(cue, p);
		return true;
	},
	/** Detaches the gesture listeners and closes the context. For tests and hot reload; the engine is single-use after this. */
	dispose() {
		disarm?.();
		unsubscribeBus?.();
		ctx?.close().catch(() => {});
		ctx = master = undefined;
	},
	/** Subscribe to enabled/volume/profile changes. Returns the unsubscribe. */
	subscribe(fn: () => void): () => void {
		subs.add(fn);
		return () => subs.delete(fn);
	},
};

/** What `use:sound` accepts. */
export interface SoundOptions {
	/** DOM event that plays the cue. @default "click" */
	on?: keyof HTMLElementEventMap;
	/** Cue to play. @default "press" */
	cue?: CueName;
}

const action: Action<HTMLElement, SoundOptions | undefined> = (node, options) => {
	let { on = "click", cue = "press" } = options ?? {};
	const fire = () => soundBus.emit(cue);
	node.addEventListener(on, fire);
	return {
		update(next) {
			node.removeEventListener(on, fire);
			({ on = "click", cue = "press" } = next ?? {});
			node.addEventListener(on, fire);
		},
		destroy: () => node.removeEventListener(on, fire),
	};
};

/**
 * The engine and the action in one name: `sound.play("success")`, `sound.enable()`, and
 * `<div use:sound={{ on: "click", cue: "press" }}>`. Silent until sound is on (`<SoundToggle />`).
 */
export const sound = Object.defineProperties(
	action,
	Object.getOwnPropertyDescriptors(api)
) as typeof action & typeof api;

if (typeof document !== "undefined") {
	unsubscribeBus = soundBus.listen((cue) => sound.play(cue));
	if (state.enabled) arm();
	// Cut off on unload, and quiet while the tab is hidden.
	addEventListener("pagehide", () => ctx?.close().catch(() => {}));
	document.addEventListener("visibilitychange", () => {
		if (!ctx) return;
		(document.hidden ? ctx.suspend() : ctx.resume()).catch(() => {});
	});
}
