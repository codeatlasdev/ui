/// <reference types="@vitest/browser-playwright" />
import { afterEach, describe, expect, it, vi } from "vitest";
import { cdp, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import Harness from "./MotionStage.test.svelte";

const emulate = (value: "reduce" | "no-preference") =>
	cdp().send("Emulation.setEmulatedMedia", {
		features: [{ name: "prefers-reduced-motion", value }],
	});

afterEach(async () => {
	vi.useRealTimers();
	await cdp().send("Emulation.setEmulatedMedia", { features: [] });
});

const stageOf = (c: Element) => c.querySelector(".ca-motion-stage") as HTMLElement;
const cycle = (c: Element) => Number(stageOf(c).dataset.cycle);
// The loop is a plain setInterval that lives only while playing. "Nothing ticks" is proven on a fake
// clock installed BEFORE render (a clock faked later would not own the component's interval),
// advanced past several loops: no wall time, and a leaked interval would tick on it. The
// IntersectionObserver and the effects run on frames, which stay real; `until` waits for them
// while the clock is advanced. Real timers are restored before polls, clicks and axe.
const fakeClock = () => vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
const LOOP = 150;
const until = async (fn: () => boolean) => {
	for (let i = 0; i < 200 && !fn(); i++) {
		await vi.advanceTimersByTimeAsync(0);
		await new Promise((r) => requestAnimationFrame(() => r(null)));
	}
	expect(fn()).toBe(true);
};
// An IntersectionObserver reports on a later frame than render: a negative asserted before it has
// reported would pass whatever the component does. Frames are real (only timers are faked).
const observed = async () => {
	for (let i = 0; i < 6; i++) await new Promise((r) => requestAnimationFrame(() => r(null)));
};
const buttons = (c: Element) => [...c.querySelectorAll("button")].map((b) => b.textContent?.trim());

describe("MotionStage", () => {
	it("plays while in view, loops, and pauses with aria-pressed", async () => {
		await emulate("no-preference");
		const { container } = await render(Harness);
		await expect.poll(() => stageOf(container).dataset.playing).toBe("true");
		const first = cycle(container);
		await expect.poll(() => cycle(container)).toBeGreaterThan(first);
		expect(await checkA11y(container)).toHaveNoViolations();

		const pause = container.querySelector("button") as HTMLButtonElement;
		expect(pause.textContent?.trim()).toBe("Pause");
		expect(pause.getAttribute("aria-pressed")).toBe("false");
		pause.click();
		await expect.poll(() => stageOf(container).dataset.playing).toBe("false");
		expect(pause.getAttribute("aria-pressed")).toBe("true");
		expect(await checkA11y(container)).toHaveNoViolations();

		pause.click();
		await expect.poll(() => stageOf(container).dataset.playing).toBe("true");
		expect(pause.getAttribute("aria-pressed")).toBe("false");
	});

	it("a paused stage does not loop", async () => {
		await emulate("no-preference");
		fakeClock();
		const { container } = await render(Harness, { loop: LOOP });
		await until(() => stageOf(container).dataset.playing === "true");
		await vi.advanceTimersByTimeAsync(LOOP * 2);
		expect(cycle(container)).toBeGreaterThan(1);
		(container.querySelector("button") as HTMLButtonElement).click();
		await until(() => stageOf(container).dataset.playing === "false");
		const stopped = cycle(container);
		await vi.advanceTimersByTimeAsync(LOOP * 4);
		expect(cycle(container)).toBe(stopped);
	});

	it("does not play while out of view", async () => {
		await emulate("no-preference");
		fakeClock();
		const { container } = await render(Harness, { spacer: 4000, loop: LOOP });
		// The observer has reported by the time a frame has passed; the clock then runs several loops.
		await observed();
		await vi.advanceTimersByTimeAsync(LOOP * 4);
		expect(stageOf(container).dataset.playing).toBe("false");
		expect(cycle(container)).toBe(0);
		vi.useRealTimers();
		stageOf(container).scrollIntoView({ block: "center" });
		await expect.poll(() => stageOf(container).dataset.playing).toBe("true");
	});

	it("a pointer or focus inside the demo takes over: stops autoplay, offers Replay", async () => {
		await emulate("no-preference");
		const { container } = await render(Harness);
		await expect.poll(() => stageOf(container).dataset.playing).toBe("true");
		expect(buttons(container)).toEqual(["Pause"]);

		(container.querySelector("input") as HTMLInputElement).focus();
		await expect.poll(() => stageOf(container).dataset.taken).toBe("true");
		expect(stageOf(container).dataset.playing).toBe("false");
		expect(buttons(container)).toEqual(["Pause", "Replay"]);
		const taken = cycle(container);
		expect(await checkA11y(container)).toHaveNoViolations();

		(container.querySelectorAll("button")[1] as HTMLButtonElement).click();
		await expect.poll(() => stageOf(container).dataset.taken).toBe("false");
		expect(stageOf(container).dataset.playing).toBe("true");
		expect(cycle(container)).toBeGreaterThan(taken);
		expect(buttons(container)).toEqual(["Pause"]);
	});

	it("a takeover stops the loop", async () => {
		await emulate("no-preference");
		fakeClock();
		const { container } = await render(Harness, { loop: LOOP });
		await until(() => stageOf(container).dataset.playing === "true");
		(container.querySelector("input") as HTMLInputElement).focus();
		await until(() => stageOf(container).dataset.taken === "true");
		const taken = cycle(container);
		await vi.advanceTimersByTimeAsync(LOOP * 4);
		expect(cycle(container)).toBe(taken);
	});

	it("pressing a key inside the demo is a takeover", async () => {
		await emulate("no-preference");
		const { container } = await render(Harness);
		await expect.poll(() => stageOf(container).dataset.playing).toBe("true");
		const input = container.querySelector("input") as HTMLInputElement;
		await userEvent.click(input);
		await expect.poll(() => stageOf(container).dataset.taken).toBe("true");
	});

	it("under reduced motion it renders the final state and never plays", async () => {
		await emulate("reduce");
		fakeClock();
		const { container } = await render(Harness, { loop: LOOP });
		await observed();
		const stage = stageOf(container);
		expect(stage.dataset.reduced).toBe("true");
		expect(stage.dataset.playing).toBe("false");
		expect((container.querySelector(".probe") as HTMLElement).dataset.final).toBe("true");
		const before = cycle(container);
		await vi.advanceTimersByTimeAsync(LOOP * 4);
		expect(cycle(container)).toBe(before);
		vi.useRealTimers();
		expect(buttons(container)).toEqual([]);
		expect(await checkA11y(container)).toHaveNoViolations();
	});

	it("a theme with motion.enter none (--ca-enter-scale: 0) renders the final state too (#268)", async () => {
		await emulate("no-preference");
		document.documentElement.style.setProperty("--ca-enter-scale", "0");
		try {
			fakeClock();
			const { container } = await render(Harness, { loop: LOOP });
			const stage = stageOf(container);
			await until(() => stage.dataset.reduced === "true");
			await observed();
			expect(stage.dataset.playing).toBe("false");
			expect((container.querySelector(".probe") as HTMLElement).dataset.final).toBe("true");
			const before = cycle(container);
			await vi.advanceTimersByTimeAsync(LOOP * 4);
			expect(cycle(container)).toBe(before);
			vi.useRealTimers();
			// the knob is live: switching entrances back on resumes autoplay
			document.documentElement.style.removeProperty("--ca-enter-scale");
			await expect.poll(() => stage.dataset.reduced).toBe("false");
		} finally {
			document.documentElement.style.removeProperty("--ca-enter-scale");
		}
	});

	it("labels the group and keeps a fixed minimum height", async () => {
		await emulate("no-preference");
		const { container } = await render(Harness);
		expect(stageOf(container).getAttribute("aria-label")).toBe("Fade rise");
		const min = Number.parseFloat(getComputedStyle(stageOf(container)).minBlockSize);
		expect(min).toBeGreaterThan(150);
		expect(stageOf(container).getBoundingClientRect().height).toBeGreaterThanOrEqual(min - 1);
	});
});
