import { flushSync } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import PresenceBlock from "./PresenceBlock.test.svelte";
import { createPresence } from "./presence.svelte.js";

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
		const { presence, setOpen } = harness(true);
		expect(presence.present).toBe(true);
		setOpen(false);
		expect(presence.present).toBe(true);
		await new Promise((r) => setTimeout(r, 60));
		expect(presence.present).toBe(true);
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
		await new Promise((r) => setTimeout(r, 250));
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
		await new Promise((r) => setTimeout(r, 150));
		expect(node.isConnected).toBe(true);
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
