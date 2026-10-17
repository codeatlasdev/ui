/// <reference types="@vitest/browser-playwright" />
import { afterEach, describe, expect, it } from "vitest";
import { cdp, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import Harness from "./MotionStage.test.svelte";

const emulate = (value: "reduce" | "no-preference") =>
	cdp().send("Emulation.setEmulatedMedia", {
		features: [{ name: "prefers-reduced-motion", value }],
	});

afterEach(async () => {
	await cdp().send("Emulation.setEmulatedMedia", { features: [] });
});

const stageOf = (c: Element) => c.querySelector(".ca-motion-stage") as HTMLElement;
const cycle = (c: Element) => Number(stageOf(c).dataset.cycle);
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
		const stopped = cycle(container);
		await new Promise((r) => setTimeout(r, 500));
		expect(cycle(container)).toBe(stopped);
		expect(await checkA11y(container)).toHaveNoViolations();

		pause.click();
		await expect.poll(() => stageOf(container).dataset.playing).toBe("true");
		expect(pause.getAttribute("aria-pressed")).toBe("false");
	});

	it("does not play while out of view", async () => {
		await emulate("no-preference");
		const { container } = await render(Harness, { spacer: 4000 });
		await new Promise((r) => setTimeout(r, 400));
		expect(stageOf(container).dataset.playing).toBe("false");
		expect(cycle(container)).toBe(0);
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
		await new Promise((r) => setTimeout(r, 500));
		expect(cycle(container)).toBe(taken);
		expect(await checkA11y(container)).toHaveNoViolations();

		(container.querySelectorAll("button")[1] as HTMLButtonElement).click();
		await expect.poll(() => stageOf(container).dataset.taken).toBe("false");
		expect(stageOf(container).dataset.playing).toBe("true");
		expect(cycle(container)).toBeGreaterThan(taken);
		expect(buttons(container)).toEqual(["Pause"]);
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
		const { container } = await render(Harness);
		const stage = stageOf(container);
		expect(stage.dataset.reduced).toBe("true");
		expect(stage.dataset.playing).toBe("false");
		expect((container.querySelector(".probe") as HTMLElement).dataset.final).toBe("true");
		const before = cycle(container);
		await new Promise((r) => setTimeout(r, 500));
		expect(cycle(container)).toBe(before);
		expect(buttons(container)).toEqual([]);
		expect(await checkA11y(container)).toHaveNoViolations();
	});

	it("a theme with motion.enter none (--ca-enter-scale: 0) renders the final state too (#268)", async () => {
		await emulate("no-preference");
		document.documentElement.style.setProperty("--ca-enter-scale", "0");
		try {
			const { container } = await render(Harness);
			const stage = stageOf(container);
			await expect.poll(() => stage.dataset.reduced).toBe("true");
			expect(stage.dataset.playing).toBe("false");
			expect((container.querySelector(".probe") as HTMLElement).dataset.final).toBe("true");
			const before = cycle(container);
			await new Promise((r) => setTimeout(r, 500));
			expect(cycle(container)).toBe(before);
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
