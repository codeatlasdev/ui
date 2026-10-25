import { afterAll, afterEach, describe, expect, it } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();
afterAll(() => GlobalRegistrator.unregister());

let n = 0;
const live: { dispose(): void }[] = [];
afterEach(() => {
	for (const s of live.splice(0)) s.dispose();
});
// Fresh module per test (AGENTS.md `?fresh=n`): the engine owns the one bus listener.
async function entry() {
	const mod = await import(`../src/lib/sound/index.js?fresh=${n++}`);
	live.push(mod.sound);
	return mod;
}

describe("use:sound", () => {
	it("the exported `sound` is both the engine and the action", async () => {
		const { sound, soundBus } = await entry();
		expect(typeof sound).toBe("function");
		expect(typeof sound.enable).toBe("function");
		expect(typeof sound.play).toBe("function");
		expect(sound.enabled).toBe(false);

		const heard: string[] = [];
		const off = soundBus.listen((c: string) => heard.push(c));
		const el = document.createElement("div");
		const act = sound(el, { on: "pointerenter", cue: "hover" });
		el.dispatchEvent(new Event("pointerenter"));
		el.dispatchEvent(new Event("click"));
		expect(heard).toEqual(["hover"]);
		act?.update?.({ on: "click", cue: "tap" });
		el.dispatchEvent(new Event("click"));
		expect(heard).toEqual(["hover", "tap"]);
		act?.destroy?.();
		el.dispatchEvent(new Event("click"));
		expect(heard).toEqual(["hover", "tap"]);
		off();
	});

	it("defaults to a press on click", async () => {
		const { sound, soundBus } = await entry();
		const heard: string[] = [];
		const off = soundBus.listen((c: string) => heard.push(c));
		const el = document.createElement("button");
		sound(el, undefined);
		el.dispatchEvent(new Event("click"));
		expect(heard).toEqual(["press"]);
		off();
	});

	it("no `soundAction` alias is exported", async () => {
		const mod = await entry();
		expect(mod.soundAction).toBeUndefined();
	});
});
