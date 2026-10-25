import { flushSync } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { settled } from "../../../tests/settled";
import PresenceBlock from "./PresenceBlock.test.svelte";
import { createPresence } from "./presence.svelte.js";

const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)));
const exiting = (el: Element) => el.getAnimations().filter((a) => a.playState === "running");
// Holds the exit animation still, so "stays present while it plays" is a property of the animation
// being unfinished, not of how long the machine takes to reach a timer. The primitive looks at the
// running animations in ONE requestAnimationFrame after the close and then awaits `finished`; ours is
// registered after it (frame callbacks run in registration order), so the animation is paused only
// once the primitive has attached to it. Call right after the close.
async function holdExit(el: Element) {
	await frame();
	const running = exiting(el);
	expect(running.length).toBeGreaterThan(0);
	for (const a of running) a.pause();
	for (let i = 0; i < 3; i++) await frame();
}
const release = (el: Element) => {
	for (const a of el.getAnimations()) a.play();
};

const cleanups: Array<() => void> = [];
afterEach(() => {
	while (cleanups.length) cleanups.pop()?.();
	document.body.innerHTML = "";
	document.getElementById("presence-style")?.remove();
});

function harness(animation: boolean) {
	const style = document.createElement("style");
	style.id = "presence-style";
	style.textContent = `@keyframes fade { from { opacity: 1 } to { opacity: 0 } }
		.anim[data-state="closed"] { animation: fade 150ms linear forwards }`;
	document.head.appendChild(style);

	const node = document.createElement("div");
	if (animation) node.className = "anim";
	node.dataset.state = "open";
	document.body.appendChild(node);

	let release!: () => void;
	let presence!: ReturnType<typeof createPresence>;
	let open = $state(true);
	const stop = $effect.root(() => {
		presence = createPresence(() => open);
		release = presence.ref(node);
	});
	cleanups.push(stop, () => release());
	return {
		node,
		presence,
		setOpen(v: boolean) {
			open = v;
			node.dataset.state = v ? "open" : "closed";
			flushSync();
		},
	};
}

describe("createPresence", () => {
	it("stays present until the exit animation ends", async () => {
		const { node, presence, setOpen } = harness(true);
		expect(presence.present).toBe(true);
		setOpen(false);
		expect(presence.present).toBe(true);
		await holdExit(node);
		expect(presence.present).toBe(true);
		release(node);
		await expect.poll(() => presence.present, { timeout: 2000 }).toBe(false);
	});

	it("drops right after close when nothing animates", async () => {
		const { presence, setOpen } = harness(false);
		setOpen(false);
		await expect.poll(() => presence.present, { timeout: 500 }).toBe(false);
	});

	it("reopening mid-exit keeps it present", async () => {
		const { presence, setOpen } = harness(true);
		setOpen(false);
		setOpen(true);
		// What could flip it is the exit's frame callback; it was cancelled by the reopen. Let the frames
		// that would have run it, and the 150 ms exit animation if one had started, play out.
		for (let i = 0; i < 4; i++) await frame();
		await settled();
		expect(presence.present).toBe(true);
	});
});

describe("createPresence in a template", () => {
	it("keeps the node mounted through its exit when an {#if} reads `present`", async () => {
		await render(PresenceBlock, {});
		const node = document.getElementById("presence-node") as HTMLElement;
		await page.getByRole("button", { name: "toggle" }).click();
		// Not removed in the flush that flips `open`: the exit animation has to play.
		expect(node.isConnected).toBe(true);
		expect(node.dataset.state).toBe("closed");
		await holdExit(node);
		expect(node.isConnected).toBe(true);
		release(node);
		await expect.poll(() => node.isConnected, { timeout: 2000 }).toBe(false);
	});

	it("`present` goes true to false once: an effect reading it never sees a blip when the exit starts", async () => {
		const seen = vi.fn();
		await render(PresenceBlock, { onPresent: seen });
		await page.getByRole("button", { name: "toggle" }).click();
		await expect.poll(() => document.getElementById("presence-node")).toBeNull();
		expect(seen.mock.calls.map((c) => c[0])).toEqual([true, false]);
	});
});
