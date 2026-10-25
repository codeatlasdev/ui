import { afterAll, afterEach, beforeEach, describe, expect, it } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();
afterAll(() => GlobalRegistrator.unregister());

/** Counts what the engine asks of Web Audio, without making a sound. */
const made = { contexts: 0, oscillators: 0, resumed: 0 };
let reduce = false;

class Node {
	frequency = { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} };
	gain = { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} };
	detune = { value: 0 };
	type = "";
	buffer: unknown;
	connect(n: unknown) {
		return n;
	}
	start() {}
	stop() {}
}
class FakeAudioContext {
	state = "suspended";
	currentTime = 0;
	sampleRate = 8000;
	destination = new Node();
	constructor() {
		made.contexts++;
	}
	createGain = () => new Node();
	createBiquadFilter = () => new Node();
	createDynamicsCompressor = () => new Node();
	createOscillator = () => {
		made.oscillators++;
		return new Node();
	};
	createBufferSource = () => new Node();
	createBuffer = () => ({ getChannelData: () => new Float32Array(8) });
	resume = async () => {
		made.resumed++;
		this.state = "running";
	};
	suspend = async () => {};
	close = async () => {};
}

let n = 0;
const live: { dispose(): void }[] = [];
/** A fresh engine module per test (AGENTS.md `?fresh=n`): it keeps the one shared context and the persisted choice in module state, so a static import cannot be reset. */
async function engine() {
	const mod = await import(`../src/lib/sound/engine.js?fresh=${n++}`);
	const bus = await import("../src/lib/utils/sound-bus.js");
	live.push(mod.sound);
	return { sound: mod.sound, soundBus: bus.soundBus };
}

// Each fresh engine arms document listeners and owns the bus: release them so tests cannot hear each other.
afterEach(() => {
	for (const s of live.splice(0)) s.dispose();
});

const html = document.documentElement;
const gesture = () => document.dispatchEvent(new Event("pointerdown", { bubbles: true }));

beforeEach(() => {
	made.contexts = made.oscillators = made.resumed = 0;
	reduce = false;
	localStorage.clear();
	for (const a of [...html.attributes]) html.removeAttribute(a.name);
	(window as unknown as { AudioContext: unknown }).AudioContext = FakeAudioContext;
	(globalThis as unknown as { AudioContext: unknown }).AudioContext = FakeAudioContext;
	window.matchMedia = ((q: string) => ({
		matches: q.includes("reduced-motion") && reduce,
		addEventListener() {},
	})) as unknown as typeof window.matchMedia;
	(globalThis as unknown as { matchMedia: unknown }).matchMedia = window.matchMedia;
});

describe("sound engine gating", () => {
	it("creates no AudioContext before a gesture, even with sound on", async () => {
		const { sound, soundBus } = await engine();
		sound.enable(true);
		soundBus.emit("press");
		expect(made.contexts).toBe(0);
		expect(sound.unlocked).toBe(false);
	});

	it("creates the context inside the first gesture, once", async () => {
		const { sound } = await engine();
		sound.enable(true);
		gesture();
		gesture();
		expect(made.contexts).toBe(1);
		expect(sound.unlocked).toBe(true);
	});

	it("stays silent and creates no context while the toggle is off", async () => {
		const { sound, soundBus } = await engine();
		gesture();
		soundBus.emit("press");
		soundBus.emit("success");
		expect(sound.enabled).toBe(false);
		expect(made.contexts).toBe(0);
		expect(made.oscillators).toBe(0);
	});

	it("plays after enable + gesture, and goes silent again when switched off", async () => {
		const { sound, soundBus } = await engine();
		sound.enable(true);
		gesture();
		expect(sound.play("success")).toBe(true);
		const played = made.oscillators;
		expect(played).toBeGreaterThan(0);
		sound.enable(false);
		soundBus.emit("error");
		expect(made.oscillators).toBe(played);
	});

	it("drops hover and tick cues under reduced motion but keeps feedback cues", async () => {
		reduce = true;
		html.style.setProperty("--ca-sound-profile", "glass");
		const { sound } = await engine();
		sound.enable(true);
		gesture();
		expect(sound.play("hover")).toBe(false);
		expect(sound.play("tick")).toBe(false);
		expect(sound.play("success")).toBe(true);
	});

	it("allows one cue per name per 40 ms", async () => {
		const { sound } = await engine();
		sound.enable(true);
		gesture();
		expect(sound.play("press")).toBe(true);
		expect(sound.play("press")).toBe(false);
	});
});

describe("sound persistence", () => {
	it("is off by default and persists the choice and volume under ca-sound", async () => {
		const first = await engine();
		expect(first.sound.enabled).toBe(false);
		first.sound.enable(true);
		first.sound.setVolume(0.6);
		expect(JSON.parse(localStorage.getItem("ca-sound") ?? "null")).toEqual({
			enabled: true,
			volume: 0.6,
		});
		const second = await engine();
		expect(second.sound.enabled).toBe(true);
		expect(second.sound.volume).toBe(0.6);
	});

	it("ignores a corrupt stored value", async () => {
		localStorage.setItem("ca-sound", "{nope");
		const { sound } = await engine();
		expect(sound.enabled).toBe(false);
		expect(sound.volume).toBe(0.25);
	});
});
