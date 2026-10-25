// @codeatlasdev/ui/sound: opt-in, synthesized interface sound. Never re-exported from the root:
// importing this entry registers the engine on `soundBus`; without it every component's `sound`
// prop is silent. Off until the user turns it on with <SoundToggle />, and no AudioContext exists
// before their first pointer or key event.

export type { CueName, SoundProp } from "../utils/sound-bus.js";
export { soundBus } from "../utils/sound-bus.js";
export type { SoundOptions } from "./engine.js";
export { sound } from "./engine.js";
export type { SoundProfile } from "./profiles.js";
export { brutal, glass, profileFor, profiles, system, terminal } from "./profiles.js";
export { default as SoundToggle } from "./SoundToggle.svelte";
