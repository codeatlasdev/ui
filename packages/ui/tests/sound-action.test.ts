import { afterAll, describe, expect, it } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();
afterAll(() => GlobalRegistrator.unregister());

describe("use:sound", () => {
	it("the exported `sound` is itself the action and still carries the engine", async () => {
		const mod = await import("../src/lib/sound/index.js?action");
		const { sound, soundBus } = mod;
		expect(typeof sound).toBe("function");
		expect(typeof sound.enable).toBe("function");
		expect(typeof sound.play).toBe("function");
		expect(sound.enabled).toBe(false);

		const heard: string[] = [];
		const off = soundBus.listen((c) => heard.push(c));
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
		sound.dispose();
	});

	it("defaults to a press on click", async () => {
		const { sound, soundBus } = await import("../src/lib/sound/index.js?action2");
		const heard: string[] = [];
		const off = soundBus.listen((c) => heard.push(c));
		const el = document.createElement("button");
		sound(el, undefined);
		el.dispatchEvent(new Event("click"));
		expect(heard).toEqual(["press"]);
		off();
		sound.dispose();
	});

	it("no `soundAction` alias remains", async () => {
		const mod = (await import("../src/lib/sound/index.js?action3")) as Record<string, unknown>;
		expect(mod.soundAction).toBeUndefined();
		(mod.sound as { dispose(): void }).dispose();
	});
});
