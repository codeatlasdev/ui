import { flushSync } from "svelte";
import { afterEach, describe, expect, it } from "vitest";
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
