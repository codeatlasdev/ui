// ─── Sound profiles: data, like a design style ────────────────────────────────
// A profile is a handful of numbers; the cue shapes (press, two-note up/down, rising success,
// low double error, filtered sweep, tick) are derived from them in engine.ts. No audio files.

import type { CueName } from "../utils/sound-bus.js";

export type Wave = "sine" | "triangle" | "square" | "sawtooth";

export interface SoundProfile {
	id: string;
	/** Oscillator for pitched cues. */
	wave: Wave;
	/** Root pitch in Hz; every pitched cue is an interval above it. */
	root: number;
	/** Cue length multiplier (1 = 90 ms notes). Short and dry for hard styles, longer for soft ones. */
	len: number;
	/** Low-pass cutoff in Hz: low = muffled, high = bright. */
	tone: number;
	/** Noise share of a press (0 = pure pitch, 1 = pure noise click). */
	grit: number;
	/** Peak gain of the profile, 0-1, before the master volume. */
	gain: number;
	/** Cent offset between the two oscillators of a cue (0 = clean, more = chorused or detuned). */
	detune: number;
	/** Whether hover cues are part of the character. Hover is always off under reduced motion. */
	hover: boolean;
}

export const system: SoundProfile = {
	id: "system",
	wave: "sine",
	root: 660,
	len: 1,
	tone: 5200,
	grit: 0.15,
	gain: 0.5,
	detune: 0,
	hover: false,
};

export const glass: SoundProfile = {
	id: "glass",
	wave: "sine",
	root: 1046,
	len: 1.5,
	tone: 9000,
	grit: 0,
	gain: 0.4,
	detune: 7,
	hover: true,
};

export const brutal: SoundProfile = {
	id: "brutal",
	wave: "square",
	root: 196,
	len: 0.6,
	tone: 2600,
	grit: 0.8,
	gain: 0.55,
	detune: 0,
	hover: false,
};

export const terminal: SoundProfile = {
	id: "terminal",
	wave: "square",
	root: 880,
	len: 0.5,
	tone: 4200,
	grit: 0.5,
	gain: 0.4,
	detune: 0,
	hover: false,
};

/** The profiles by id. */
export const profiles: Record<string, SoundProfile> = { system, glass, brutal, terminal };

/**
 * Which profile fits a surface material (`<html data-style>`). A profile id (`--ca-sound-profile`)
 * names itself, so it needs no entry. Unknown ids fall back to `system`; the remaining styles of the
 * spec (soft, paper, pencil, chip, ambient) arrive with their profiles.
 */
const FOR: Record<string, string> = {
	glass: "glass",
	frosted: "glass",
};

export function profileFor(id: string | null | undefined): SoundProfile {
	return profiles[id ?? ""] ?? profiles[FOR[id ?? ""] ?? "system"];
}

/** Cues that never play under reduced motion: ambient, hover and scroll/progress sounds. */
export const MOTION_CUES: Partial<Record<CueName, true>> = { hover: true, tick: true };
