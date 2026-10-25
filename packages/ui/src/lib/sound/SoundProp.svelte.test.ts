import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import Button from "../components/Button/Button.svelte";
import Toaster from "../components/Toast/Toaster.svelte";
import { toast } from "../stores/toast.svelte.js";
import { type CueName, soundBus } from "../utils/sound-bus.js";
import SoundProp from "./SoundProp.test.svelte";

let heard: CueName[] = [];
let off: () => void;

beforeEach(() => {
	heard = [];
	off = soundBus.listen((c) => heard.push(c));
});

afterEach(() => {
	off();
	for (const t of [...toast.items]) toast.remove(t.id);
});

describe("sound prop through soundBus", () => {
	it("is silent by default: no prop, no cue", async () => {
		const screen = await render(SoundProp, {});
		await screen.getByRole("button", { name: "Press me" }).click();
		await screen.getByRole("switch", { name: "Wi-Fi" }).click();
		await screen.getByRole("tab", { name: "Two" }).click();
		expect(heard).toEqual([]);
	});

	it("Button plays press then release", async () => {
		const screen = await render(SoundProp, { sound: true });
		await screen.getByRole("button", { name: "Press me" }).click();
		expect(heard).toEqual(["press", "release"]);
	});

	it("Button keeps the caller's own pointer handlers", async () => {
		let own = 0;
		const screen = await render(Button, { sound: true, onpointerdown: () => own++ });
		await screen.getByRole("button").click();
		expect(own).toBe(1);
		expect(heard).toEqual(["press", "release"]);
	});

	it("a disabled Button stays silent", async () => {
		const screen = await render(Button, { sound: true, disabled: true });
		await screen.getByRole("button").click({ force: true });
		expect(heard).toEqual([]);
	});

	it("Switch plays toggle-on, then toggle-off", async () => {
		const screen = await render(SoundProp, { sound: true });
		const sw = screen.getByRole("switch", { name: "Wi-Fi" });
		await sw.click();
		await sw.click();
		expect(heard).toEqual(["toggle-on", "toggle-off"]);
	});

	it("Tabs plays tab when the selection changes", async () => {
		const screen = await render(SoundProp, { sound: true });
		await screen.getByRole("tab", { name: "Two" }).click();
		expect(heard).toContain("tab");
	});

	it("Slider plays tick per step the user crosses", async () => {
		const screen = await render(SoundProp, { sound: true });
		screen.getByRole("slider").element().focus();
		await userEvent.keyboard("{ArrowRight}");
		expect(heard).toEqual(["tick"]);
	});

	it("Dialog plays open and close as `open` changes", async () => {
		const screen = await render(SoundProp, { sound: true });
		await screen.getByRole("button", { name: "Open dialog" }).click();
		await userEvent.keyboard("{Escape}");
		await expect.poll(() => heard).toEqual(["open", "close"]);
	});

	it("a cue name replaces the default cue", async () => {
		const screen = await render(SoundProp, { sound: "select" });
		await screen.getByRole("tab", { name: "Two" }).click();
		expect(heard).toEqual(["select"]);
	});

	it("Toast plays the cue of its variant, and only when asked", async () => {
		await render(Toaster, {});
		// TOAST_MAX is 3 and drops the oldest, so the silent toast goes first.
		toast.warning("Careful");
		toast.success("Saved", { sound: true });
		toast.error("Failed", { sound: true });
		toast.info("FYI", { sound: true });
		await expect.poll(() => [...heard].sort()).toEqual(["error", "notify", "success"]);
	});
});
