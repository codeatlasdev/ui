import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import AudioPlayer from "./AudioPlayer.svelte";
import Pair from "./AudioPlayer.test.svelte";

/** A silent 16-bit mono PCM WAV of `seconds` length, as a blob URL the real <audio> can decode. */
function wavUrl(seconds = 1, rate = 8000): string {
	const samples = Math.round(seconds * rate);
	const buf = new ArrayBuffer(44 + samples * 2);
	const v = new DataView(buf);
	const str = (o: number, s: string) => {
		for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
	};
	str(0, "RIFF");
	v.setUint32(4, 36 + samples * 2, true);
	str(8, "WAVE");
	str(12, "fmt ");
	v.setUint32(16, 16, true);
	v.setUint16(20, 1, true);
	v.setUint16(22, 1, true);
	v.setUint32(24, rate, true);
	v.setUint32(28, rate * 2, true);
	v.setUint16(32, 2, true);
	v.setUint16(34, 16, true);
	str(36, "data");
	v.setUint32(40, samples * 2, true);
	return URL.createObjectURL(new Blob([buf], { type: "audio/wav" }));
}

const urls: string[] = [];
const wav = (s = 1) => {
	const u = wavUrl(s);
	urls.push(u);
	return u;
};
afterEach(() => {
	for (const u of urls.splice(0)) URL.revokeObjectURL(u);
	vi.restoreAllMocks();
});

/** Polls `fn` until true (vi.waitFor re-runs on throw, no hand-rolled timers). */
const waitFor = (fn: () => boolean, timeout = 3000) =>
	vi.waitFor(
		() => {
			if (!fn()) throw new Error("condition not met");
		},
		{ timeout, interval: 20 }
	);
const frame = () => {
	const { promise, resolve } = Promise.withResolvers<void>();
	requestAnimationFrame(() => resolve());
	return promise;
};

const audioOf = (c: Element) => c.querySelector("audio") as HTMLAudioElement;
const slider = (c: Element) => c.querySelector("[role=slider]") as HTMLElement;
const playBtn = (c: Element) => c.querySelector(".ca-audio__play") as HTMLButtonElement;
const rateBtn = (c: Element) => c.querySelector(".ca-audio__rate") as HTMLButtonElement;
const bars = (c: Element) => c.querySelectorAll(".ca-audio__bar").length;

/** Real `play()` on a fully loaded element, so currentTime/duration are real. */
async function startAndLoad(c: Element) {
	playBtn(c).click();
	await waitFor(() => Number.isFinite(audioOf(c).duration) && audioOf(c).readyState >= 1);
}

describe("AudioPlayer", () => {
	it("is a named group with a labelled play button and a slider", async () => {
		const screen = await render(AudioPlayer, { props: { src: wav(), duration: 31 } });
		const group = screen.getByRole("group", { name: "Audio message" });
		await expect.element(group).toBeVisible();
		await expect.element(screen.getByRole("button", { name: "Play" })).toBeVisible();
		expect(slider(screen.container).getAttribute("aria-label")).toBe("Seek");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("uses the label prop as the group name", async () => {
		const screen = await render(AudioPlayer, {
			props: { src: wav(), label: "Voice note from Ana" },
		});
		await expect.element(screen.getByRole("group", { name: "Voice note from Ana" })).toBeVisible();
	});

	it("does not set src or fetch anything until the first play", async () => {
		const src = wav();
		const screen = await render(AudioPlayer, { props: { src, duration: 1 } });
		const audio = audioOf(screen.container);
		expect(audio.hasAttribute("src")).toBe(false);
		expect(audio.networkState).toBe(HTMLMediaElement.NETWORK_EMPTY);
		playBtn(screen.container).click();
		await waitFor(() => audio.hasAttribute("src"));
		expect(audio.getAttribute("src")).toBe(src);
	});

	it("shows the duration prop before metadata and the real one once known", async () => {
		const screen = await render(AudioPlayer, { props: { src: wav(1), duration: 31 } });
		const total = screen.container.querySelector(".ca-audio__total") as HTMLElement;
		expect(total.textContent?.trim()).toBe("0:31");
		expect(slider(screen.container).getAttribute("aria-valuemax")).toBe("31");
		await startAndLoad(screen.container);
		await waitFor(() => total.textContent?.trim() === "0:01");
		expect(slider(screen.container).getAttribute("aria-valuemax")).toBe("1");
	});

	it("toggles play and pause with the label and the audio element", async () => {
		const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
		const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
		const onplay = vi.fn();
		const onpause = vi.fn();
		const screen = await render(AudioPlayer, {
			props: { src: wav(), duration: 5, onplay, onpause },
		});
		const audio = audioOf(screen.container);
		playBtn(screen.container).click();
		await waitFor(() => play.mock.calls.length === 1);
		audio.dispatchEvent(new Event("play"));
		await expect.element(screen.getByRole("button", { name: "Pause" })).toBeVisible();
		expect(onplay).toHaveBeenCalledTimes(1);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
		playBtn(screen.container).click();
		expect(pause).toHaveBeenCalled();
		audio.dispatchEvent(new Event("pause"));
		await expect.element(screen.getByRole("button", { name: "Play" })).toBeVisible();
		expect(onpause).toHaveBeenCalledTimes(1);
	});

	it("cycles the playback rate through rates and wraps around", async () => {
		const screen = await render(AudioPlayer, { props: { src: wav(), duration: 5 } });
		const audio = audioOf(screen.container);
		const btn = rateBtn(screen.container);
		expect(btn.textContent?.trim()).toBe("1x");
		expect(btn.getAttribute("aria-label")).toBe("Playback speed 1x");
		btn.click();
		await expect.element(screen.getByRole("button", { name: "Playback speed 1.5x" })).toBeVisible();
		expect(audio.playbackRate).toBe(1.5);
		btn.click();
		await waitFor(() => audio.playbackRate === 2);
		btn.click();
		await waitFor(() => btn.textContent?.trim() === "1x");
		expect(audio.playbackRate).toBe(1);
	});

	it("honours a custom rates list", async () => {
		const screen = await render(AudioPlayer, {
			props: { src: wav(), duration: 5, rates: [0.5, 1] },
		});
		const btn = rateBtn(screen.container);
		expect(btn.textContent?.trim()).toBe("0.5x");
		btn.click();
		await waitFor(() => btn.textContent?.trim() === "1x");
		expect(audioOf(screen.container).playbackRate).toBe(1);
	});

	it("keeps the chosen rate when the src is attached on first play", async () => {
		const screen = await render(AudioPlayer, { props: { src: wav(), duration: 5 } });
		rateBtn(screen.container).click();
		await startAndLoad(screen.container);
		expect(audioOf(screen.container).playbackRate).toBe(1.5);
	});

	it("exposes slider semantics from duration and current time", async () => {
		const screen = await render(AudioPlayer, { props: { src: wav(), duration: 31 } });
		const s = slider(screen.container);
		expect(s.getAttribute("aria-valuemin")).toBe("0");
		expect(s.getAttribute("aria-valuemax")).toBe("31");
		expect(s.getAttribute("aria-valuenow")).toBe("0");
		expect(s.getAttribute("aria-valuetext")).toBe("0:00 of 0:31");
		expect(s.getAttribute("tabindex")).toBe("0");
	});

	it("seeks with the keyboard: arrows, page keys, Home and End", async () => {
		const screen = await render(AudioPlayer, { props: { src: wav(40), duration: 40 } });
		const s = slider(screen.container);
		const audio = audioOf(screen.container);
		await startAndLoad(screen.container);
		playBtn(screen.container).click(); // pause: keep the clock still
		await waitFor(() => audio.paused);
		s.focus();
		const key = async (k: string) => {
			s.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
			await frame();
		};
		audio.currentTime = 0;
		await key("ArrowRight");
		expect(audio.currentTime).toBeCloseTo(5, 1);
		await key("ArrowUp");
		expect(audio.currentTime).toBeCloseTo(10, 1);
		await key("PageUp");
		expect(audio.currentTime).toBeCloseTo(20, 1);
		await key("ArrowLeft");
		expect(audio.currentTime).toBeCloseTo(15, 1);
		await key("ArrowDown");
		expect(audio.currentTime).toBeCloseTo(10, 1);
		await key("PageDown");
		expect(audio.currentTime).toBeCloseTo(0, 1);
		await key("End");
		expect(audio.currentTime).toBeCloseTo(40, 0);
		await key("Home");
		expect(audio.currentTime).toBe(0);
		await waitFor(() => s.getAttribute("aria-valuenow") === "0");
	});

	it("seeks from the keyboard before the first play, attaching the src", async () => {
		const screen = await render(AudioPlayer, { props: { src: wav(40), duration: 40 } });
		const s = slider(screen.container);
		s.focus();
		s.dispatchEvent(
			new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true })
		);
		await waitFor(() => s.getAttribute("aria-valuenow") === "5");
		expect(s.getAttribute("aria-valuetext")).toBe("0:05 of 0:40");
		// Seeking is not playing: it must not start playback.
		expect(audioOf(screen.container).paused).toBe(true);
	});

	it("seeks by clicking the waveform, proportionally to the width", async () => {
		const screen = await render(AudioPlayer, {
			props: { src: wav(40), duration: 40, peaks: [0.2, 0.8, 0.5] },
		});
		const s = slider(screen.container);
		const audio = audioOf(screen.container);
		await startAndLoad(screen.container);
		playBtn(screen.container).click();
		await waitFor(() => audio.paused);
		const r = s.getBoundingClientRect();
		const at = (f: number) => ({
			bubbles: true,
			pointerId: 1,
			pointerType: "mouse",
			isPrimary: true,
			button: 0,
			clientX: r.left + r.width * f,
			clientY: r.top + r.height / 2,
		});
		s.dispatchEvent(new PointerEvent("pointerdown", at(0.25)));
		await frame();
		expect(audio.currentTime).toBeCloseTo(10, 0);
		s.dispatchEvent(new PointerEvent("pointermove", at(0.75)));
		await frame();
		expect(audio.currentTime).toBeCloseTo(30, 0);
		s.dispatchEvent(new PointerEvent("pointerup", at(0.75)));
		await frame();
		s.dispatchEvent(new PointerEvent("pointermove", at(0.1)));
		await frame();
		expect(audio.currentTime).toBeCloseTo(30, 0);
	});

	it("treats the right edge as the start in RTL", async () => {
		const screen = await render(AudioPlayer, { props: { src: wav(40), duration: 40 } });
		const root = screen.container.querySelector(".ca-audio") as HTMLElement;
		root.setAttribute("dir", "rtl");
		const s = slider(screen.container);
		const audio = audioOf(screen.container);
		await startAndLoad(screen.container);
		playBtn(screen.container).click();
		await waitFor(() => audio.paused);
		const r = s.getBoundingClientRect();
		s.dispatchEvent(
			new PointerEvent("pointerdown", {
				bubbles: true,
				pointerId: 1,
				pointerType: "mouse",
				isPrimary: true,
				button: 0,
				clientX: r.left + r.width * 0.75,
				clientY: r.top + r.height / 2,
			})
		);
		await frame();
		expect(audio.currentTime).toBeCloseTo(10, 0);
	});

	it("resamples peaks to the bars that fit the width, keeping the max per bucket", async () => {
		const peaks = Array.from({ length: 500 }, (_, i) => (i === 250 ? 1 : 0.1));
		const screen = await render(AudioPlayer, { props: { src: wav(), duration: 5, peaks } });
		const s = slider(screen.container);
		await waitFor(() => bars(screen.container) > 0);
		const n = bars(screen.container);
		expect(n).toBeGreaterThan(5);
		expect(n).toBeLessThan(peaks.length);
		// The single spike survives the downsample: exactly one bar is the tallest.
		const heights = [...screen.container.querySelectorAll<HTMLElement>(".ca-audio__bar")].map((b) =>
			Number.parseFloat(b.style.getPropertyValue("--h"))
		);
		expect(Math.max(...heights)).toBeCloseTo(1, 2);
		expect(heights.filter((h) => h > 0.5).length).toBe(1);
		// Narrower container: fewer bars.
		(screen.container.querySelector(".ca-audio") as HTMLElement).style.width = "160px";
		await waitFor(() => bars(screen.container) < n);
	});

	it("draws a flat placeholder of low bars when peaks are absent", async () => {
		const screen = await render(AudioPlayer, { props: { src: wav(), duration: 5 } });
		await waitFor(() => bars(screen.container) > 0);
		const heights = [...screen.container.querySelectorAll<HTMLElement>(".ca-audio__bar")].map((b) =>
			Number.parseFloat(b.style.getPropertyValue("--h"))
		);
		expect(Math.max(...heights)).toBeLessThanOrEqual(0.3);
		expect(Math.min(...heights)).toBeGreaterThan(0);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("marks played bars from the current position", async () => {
		const screen = await render(AudioPlayer, {
			props: { src: wav(40), duration: 40, peaks: [0.5, 0.5] },
		});
		const s = slider(screen.container);
		await waitFor(() => bars(screen.container) > 0);
		expect(screen.container.querySelectorAll(".ca-audio__bar--played").length).toBe(0);
		s.focus();
		s.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true, cancelable: true }));
		await waitFor(
			() =>
				screen.container.querySelectorAll(".ca-audio__bar--played").length ===
				bars(screen.container)
		);
	});

	it("pauses the other player when one starts", async () => {
		const screen = await render(Pair, { props: { a: wav(5), b: wav(5) } });
		const [a, b] = [...screen.container.querySelectorAll("audio")] as HTMLAudioElement[];
		const [pa, pb] = [...screen.container.querySelectorAll<HTMLButtonElement>(".ca-audio__play")];
		pa.click();
		await waitFor(() => !a.paused);
		pb.click();
		await waitFor(() => !b.paused);
		await waitFor(() => a.paused);
		expect(b.paused).toBe(false);
		expect(pa.getAttribute("aria-label")).toBe("Play");
		expect(pb.getAttribute("aria-label")).toBe("Pause");
		pb.click();
		await waitFor(() => b.paused);
	});

	it("shows the error text, links it to the group and disables seeking", async () => {
		const onerror = vi.fn();
		vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
		const screen = await render(AudioPlayer, { props: { src: wav(), duration: 31, onerror } });
		const audio = audioOf(screen.container);
		playBtn(screen.container).click();
		await waitFor(() => audio.hasAttribute("src"));
		audio.dispatchEvent(new Event("error"));
		await expect.element(screen.getByText("Could not play this audio")).toBeVisible();
		expect(onerror).toHaveBeenCalledTimes(1);
		const group = screen.container.querySelector(".ca-audio") as HTMLElement;
		const msg = screen.container.querySelector(".ca-audio__error") as HTMLElement;
		expect(group.getAttribute("aria-describedby")).toBe(msg.id);
		const s = slider(screen.container);
		expect(s.getAttribute("aria-disabled")).toBe("true");
		const before = audio.currentTime;
		s.dispatchEvent(
			new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true })
		);
		await frame();
		expect(audio.currentTime).toBe(before);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("reports a real decode failure through onerror", async () => {
		const bad = URL.createObjectURL(new Blob(["not audio"], { type: "audio/wav" }));
		urls.push(bad);
		const onerror = vi.fn();
		const screen = await render(AudioPlayer, { props: { src: bad, onerror } });
		playBtn(screen.container).click();
		await waitFor(() => onerror.mock.calls.length > 0);
		await expect.element(screen.getByText("Could not play this audio")).toBeVisible();
	});

	it("is busy while the first play is fetching", async () => {
		const screen = await render(AudioPlayer, { props: { src: wav(), duration: 5 } });
		const audio = audioOf(screen.container);
		const group = screen.container.querySelector(".ca-audio") as HTMLElement;
		expect(group.hasAttribute("aria-busy")).toBe(false);
		audio.dispatchEvent(new Event("waiting"));
		await waitFor(() => group.getAttribute("aria-busy") === "true");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
		audio.dispatchEvent(new Event("playing"));
		await waitFor(() => !group.hasAttribute("aria-busy"));
	});

	it("fires onended, resets to the start and shows play again", async () => {
		const onended = vi.fn();
		const screen = await render(AudioPlayer, { props: { src: wav(1), duration: 1, onended } });
		const audio = audioOf(screen.container);
		await startAndLoad(screen.container);
		await waitFor(() => onended.mock.calls.length > 0, 4000);
		expect(playBtn(screen.container).getAttribute("aria-label")).toBe("Play");
		expect(slider(screen.container).getAttribute("aria-valuenow")).toBe("0");
		expect(audio.currentTime).toBe(0);
	});

	it("pauses its audio when destroyed", async () => {
		const screen = await render(AudioPlayer, { props: { src: wav(5), duration: 5 } });
		const audio = audioOf(screen.container);
		await startAndLoad(screen.container);
		await waitFor(() => !audio.paused);
		screen.unmount();
		expect(audio.paused).toBe(true);
	});

	it("passes axe while playing", async () => {
		const screen = await render(AudioPlayer, {
			props: { src: wav(5), duration: 5, peaks: [0.1, 0.9, 0.4, 0.7] },
		});
		await startAndLoad(screen.container);
		await waitFor(() => !audioOf(screen.container).paused);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("passes axe with peaks", async () => {
		const screen = await render(AudioPlayer, {
			props: { src: wav(), duration: 12, peaks: [0.1, 0.9, 0.4, 0.7, 0.3] },
		});
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});
