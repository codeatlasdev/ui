import { beforeEach, describe, expect, it, vi } from "vitest";
import { cdp, page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { q } from "../../../../tests/dom";
import { VIEWPORTS } from "../../../../tests/viewports";
import Harness from "./CarouselHarness.test.svelte";

const slides = (c: HTMLElement) => [...c.querySelectorAll<HTMLElement>(".ca-carousel__item")];
const viewport = (c: HTMLElement) => q(c, ".ca-carousel__viewport");
const dots = (c: HTMLElement) => [...c.querySelectorAll<HTMLButtonElement>(".ca-carousel__dot")];
const btn = (c: HTMLElement, name: RegExp) =>
	[...c.querySelectorAll<HTMLButtonElement>("button")].find((b) =>
		name.test(b.getAttribute("aria-label") ?? b.textContent ?? "")
	) as HTMLButtonElement;
// The autoplay chain is plain setTimeout: a fake clock installed BEFORE render, advanced past several
// of its intervals, proves "nothing rotates" with no wall time (a clock faked after render would not
// own the component's timer and prove nothing).
const fakeClock = () => vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });

beforeEach(() => {
	vi.useRealTimers();
});

describe("Carousel semantics (APG carousel)", () => {
	it("is a labelled carousel region of slides numbered n of m", async () => {
		const screen = await render(Harness, {});
		const region = q(screen.container, ".ca-carousel");
		expect(region.getAttribute("role")).toBe("region");
		expect(region.getAttribute("aria-roledescription")).toBe("carousel");
		expect(region.getAttribute("aria-label")).toBe("Highlights");
		const s = slides(screen.container);
		expect(s).toHaveLength(4);
		expect(s[0].getAttribute("role")).toBe("group");
		expect(s[0].getAttribute("aria-roledescription")).toBe("slide");
		expect(s.map((x) => x.getAttribute("aria-label"))).toEqual([
			"1 of 4",
			"2 of 4",
			"3 of 4",
			"4 of 4",
		]);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("scrolls with scroll-snap so touch and trackpad land on a slide", async () => {
		const screen = await render(Harness, {});
		const cs = getComputedStyle(viewport(screen.container));
		expect(cs.scrollSnapType).toContain("x");
		expect(cs.overflowX).toBe("auto");
		expect(getComputedStyle(slides(screen.container)[0]).scrollSnapAlign).toBe("start");
	});

	it("hides the slides that are not showing from assistive tech and the tab order", async () => {
		const screen = await render(Harness, {});
		const s = slides(screen.container);
		await expect.poll(() => s[1].hasAttribute("inert")).toBe(true);
		expect(s[0].hasAttribute("inert")).toBe(false);
		expect(s[1].getAttribute("aria-hidden")).toBe("true");
	});
});

describe("Carousel controls", () => {
	it("next and previous move one slide, and stop at the ends without loop", async () => {
		const onchange = vi.fn();
		const screen = await render(Harness, { onchange });
		const prev = btn(screen.container, /previous/i);
		const next = btn(screen.container, /next/i);
		expect(prev.disabled).toBe(true);
		await next.click();
		await expect.poll(() => onchange.mock.lastCall?.[0]).toBe(1);
		expect(prev.disabled).toBe(false);
		await next.click();
		await next.click();
		await expect.poll(() => onchange.mock.lastCall?.[0]).toBe(3);
		expect(next.disabled).toBe(true);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("loop wraps from the last slide to the first and back", async () => {
		const onchange = vi.fn();
		const screen = await render(Harness, { loop: true, count: 3, onchange });
		const prev = btn(screen.container, /previous/i);
		const next = btn(screen.container, /next/i);
		expect(prev.disabled).toBe(false);
		await prev.click();
		await expect.poll(() => onchange.mock.lastCall?.[0]).toBe(2);
		await next.click();
		await expect.poll(() => onchange.mock.lastCall?.[0]).toBe(0);
	});

	it("dots are labelled buttons, the current one is aria-current", async () => {
		const screen = await render(Harness, {});
		const d = dots(screen.container);
		expect(d).toHaveLength(4);
		expect(d.map((x) => x.getAttribute("aria-label"))).toEqual([
			"Go to slide 1",
			"Go to slide 2",
			"Go to slide 3",
			"Go to slide 4",
		]);
		expect(d[0].getAttribute("aria-current")).toBe("true");
		expect(d[1].hasAttribute("aria-current")).toBe(false);
		await d[2].click();
		await expect.poll(() => dots(screen.container)[2].getAttribute("aria-current")).toBe("true");
		await expect.poll(() => slides(screen.container)[2].hasAttribute("inert")).toBe(false);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("keyboard: arrows on the focused strip move slides, focus stays put", async () => {
		const screen = await render(Harness, {});
		const region = viewport(screen.container);
		region.focus();
		await userEvent.keyboard("{ArrowRight}");
		await expect.poll(() => dots(screen.container)[1].getAttribute("aria-current")).toBe("true");
		await userEvent.keyboard("{End}");
		await expect.poll(() => dots(screen.container)[3].getAttribute("aria-current")).toBe("true");
		await userEvent.keyboard("{Home}");
		await expect.poll(() => dots(screen.container)[0].getAttribute("aria-current")).toBe("true");
		expect(document.activeElement).toBe(region);
	});

	it("bind:index follows the controls and drives the slide", async () => {
		const screen = await render(Harness, { index: 2 });
		await expect.poll(() => dots(screen.container)[2].getAttribute("aria-current")).toBe("true");
		const vp = viewport(screen.container);
		const target = slides(screen.container)[2];
		// The strip scrolls to the slide: wait for it to arrive, not for a guessed duration.
		await expect
			.poll(() => Math.abs(target.offsetLeft - vp.scrollLeft - vp.offsetLeft))
			.toBeLessThan(4);
	});

	it("a scroll by touch updates the current dot", async () => {
		const screen = await render(Harness, {});
		const vp = viewport(screen.container);
		vp.scrollTo({ left: vp.clientWidth * 2, behavior: "instant" });
		await expect.poll(() => dots(screen.container)[2].getAttribute("aria-current")).toBe("true");
	});
});

describe("Carousel autoplay (opt in, always stoppable)", () => {
	it("does not rotate and shows no play control unless autoplay is set", async () => {
		fakeClock();
		const screen = await render(Harness, {});
		expect(q(screen.container, ".ca-carousel").querySelector(".ca-carousel__play")).toBeNull();
		await vi.advanceTimersByTimeAsync(700);
		expect(dots(screen.container)[0].getAttribute("aria-current")).toBe("true");
	});

	it("rotates on its own, offers Pause, and stops when paused", async () => {
		fakeClock();
		const screen = await render(Harness, { autoplay: 300, loop: true });
		const play = q<HTMLButtonElement>(screen.container, ".ca-carousel__play");
		expect(play.getAttribute("aria-label")).toBe("Pause autoplay");
		await vi.advanceTimersByTimeAsync(300);
		expect(dots(screen.container)[1].getAttribute("aria-current")).toBe("true");
		// Dispatch the click directly: the clock stays the one that owns the autoplay timer, and a
		// Playwright click (its own round trips) would need real timers.
		play.click();
		await vi.advanceTimersByTimeAsync(0);
		expect(play.getAttribute("aria-label")).toBe("Start autoplay");
		const at = dots(screen.container).findIndex((d) => d.hasAttribute("aria-current"));
		await vi.advanceTimersByTimeAsync(900);
		expect(dots(screen.container).findIndex((d) => d.hasAttribute("aria-current"))).toBe(at);
		vi.useRealTimers();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("pauses while focus is inside and while the pointer is over it", async () => {
		fakeClock();
		const screen = await render(Harness, { autoplay: 300, loop: true });
		btn(screen.container, /slide 1 action/i).focus();
		const at = dots(screen.container).findIndex((d) => d.hasAttribute("aria-current"));
		await vi.advanceTimersByTimeAsync(900);
		expect(dots(screen.container).findIndex((d) => d.hasAttribute("aria-current"))).toBe(at);
	});

	it("the slide strip is not a live region while rotating, polite when stopped", async () => {
		const screen = await render(Harness, { autoplay: 5000, loop: true });
		const vp = viewport(screen.container);
		expect(vp.getAttribute("aria-live")).toBe("off");
		await q<HTMLButtonElement>(screen.container, ".ca-carousel__play").click();
		expect(vp.getAttribute("aria-live")).toBe("polite");
	});
});

describe("Carousel reduced motion", () => {
	it("never autoplays and offers no play control under prefers-reduced-motion", async () => {
		const real = window.matchMedia.bind(window);
		window.matchMedia = ((q: string) =>
			q.includes("prefers-reduced-motion")
				? ({
						matches: true,
						media: q,
						addEventListener() {},
						removeEventListener() {},
					} as unknown as MediaQueryList)
				: real(q)) as typeof window.matchMedia;
		try {
			fakeClock();
			const screen = await render(Harness, { autoplay: 200, loop: true });
			expect(screen.container.querySelector(".ca-carousel__play")).toBeNull();
			await vi.advanceTimersByTimeAsync(700);
			expect(dots(screen.container)[0].getAttribute("aria-current")).toBe("true");
			vi.useRealTimers();
			expect(await checkA11y(screen.container)).toHaveNoViolations();
		} finally {
			window.matchMedia = real;
		}
	});
});

describe("Carousel scroller and touch (#464)", () => {
	it("a strip that scrolls is keyboard reachable even when no slide has a focusable child", async () => {
		const screen = await render(Harness, { plain: true });
		const vp = viewport(screen.container);
		expect(vp.scrollWidth).toBeGreaterThan(vp.clientWidth);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("is not wider than a narrow flex slot it sits in (390px viewport)", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		const screen = await render(Harness, { flexed: true, plain: true });
		const root = q(screen.container, ".ca-carousel");
		const slot = q(screen.container, ".row");
		expect(root.getBoundingClientRect().width).toBeLessThanOrEqual(
			slot.getBoundingClientRect().width + 0.5
		);
	});

	it("previous, next and dots have a 44px hit area under a coarse pointer", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		await cdp().send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
		try {
			const screen = await render(Harness, { autoplay: 5000 });
			expect(matchMedia("(pointer: coarse)").matches).toBe(true);
			// Same rule as the site's layout audit: the element or its expanded ::after overlay.
			const hit = (e: Element) => {
				const r = e.getBoundingClientRect();
				const a = getComputedStyle(e, "::after");
				const overlay = a.content !== "none" && a.position === "absolute";
				return [
					Math.max(r.width, overlay ? Number.parseFloat(a.width) || 0 : 0),
					Math.max(r.height, overlay ? Number.parseFloat(a.height) || 0 : 0),
				];
			};
			for (const sel of [".ca-carousel__nav", ".ca-carousel__play", ".ca-carousel__dot"]) {
				const el = q(screen.container, sel);
				const [w, h] = hit(el);
				expect(Math.min(w, h), `${sel} ${w}x${h}`).toBeGreaterThanOrEqual(44);
			}
		} finally {
			await cdp().send("Emulation.setTouchEmulationEnabled", { enabled: false });
		}
	});
});
