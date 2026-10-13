// The one motion runtime for the landing page: GSAP + ScrollTrigger, Lenis as the only smooth-scroll engine.
// Contract: the HTML/CSS already renders every final state. Nothing here is needed to read the page.
//   reduced motion -> nothing runs.
//   touch / narrow -> native scroll, beats play once as reveals (no pin, no scrub, no Lenis).
//   desktop        -> Lenis + scrubbed chapters.
// Glass rule: only opacity, clip-path and transforms on inner wrappers; never on a backdrop-filter element or its ancestors.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);
// The mobile URL bar resizes the viewport; refreshing on it makes triggers jump.
ScrollTrigger.config({ ignoreMobileResize: true });

export const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
/** Phones and tablets: native scroll only. Mirrors the `touch` class set by the inline script in index.astro. */
export const touch = () =>
	matchMedia("(pointer: coarse)").matches || matchMedia("(max-width: 900px)").matches;
export { gsap, ScrollTrigger };

let lenis: Lenis | undefined;
let tick: ((t: number) => void) | undefined;

/** Starts Lenis and wires it to ScrollTrigger. Idempotent. */
export function startScroll(): Lenis | undefined {
	if (reduced() || touch() || lenis) return lenis;
	lenis = new Lenis({ lerp: 0.12, smoothWheel: true, anchors: { offset: -72 } });
	lenis.on("scroll", ScrollTrigger.update);
	tick = (t) => lenis?.raf(t * 1000);
	gsap.ticker.add(tick);
	gsap.ticker.lagSmoothing(0);
	return lenis;
}

export function stopScroll() {
	if (tick) gsap.ticker.remove(tick);
	lenis?.destroy();
	lenis = undefined;
	tick = undefined;
}

/**
 * Splits a heading into words. The unsplit text stays as the accessible name (aria-label),
 * the split words are hidden from assistive tech. Plain-text headings only: never call this on
 * elements that contain links or inline markup.
 */
export function splitWords(el: HTMLElement): HTMLElement[] {
	if (el.dataset.split) return [...el.querySelectorAll<HTMLElement>(".w > span")];
	const text = el.textContent?.trim() ?? "";
	if (!text) return [];
	el.setAttribute("aria-label", text);
	el.dataset.split = "1";
	el.textContent = "";
	const inner: HTMLElement[] = [];
	text.split(/\s+/).forEach((word, i, all) => {
		const w = document.createElement("span");
		w.className = "w";
		w.setAttribute("aria-hidden", "true");
		const s = document.createElement("span");
		s.textContent = word;
		w.append(s);
		el.append(w);
		if (i < all.length - 1) el.append(document.createTextNode(" "));
		inner.push(s);
	});
	return inner;
}

/** Word-by-word lift for every `[data-rise]` heading once it enters the viewport. */
export function riseHeadings(): void {
	document.querySelectorAll<HTMLElement>("[data-rise]").forEach((h) => {
		// Already painted on screen: leave it (see reveals()).
		if (h.getBoundingClientRect().top < innerHeight) return;
		const words = splitWords(h);
		if (!words.length) return;
		gsap.set(words, { yPercent: 110 });
		ScrollTrigger.create({
			trigger: h,
			start: "top 88%",
			once: true,
			onEnter: () =>
				gsap.to(words, { yPercent: 0, duration: 0.8, ease: "power4.out", stagger: 0.04 }),
		});
	});
}

/** Fade/lift for supporting blocks. Opacity and inner transform only. */
export function reveals(): void {
	gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
		// Boot runs on idle, after first paint: anything already on screen (or scrolled past)
		// stays as painted. Only content still below the fold rises in.
		if (el.getBoundingClientRect().top < innerHeight) return;
		gsap.set(el, { opacity: 0, y: 18 });
		ScrollTrigger.create({
			trigger: el,
			start: "top 90%",
			once: true,
			onEnter: () =>
				gsap.to(el, {
					opacity: 1,
					y: 0,
					duration: 0.7,
					ease: "power3.out",
					delay: Number(el.dataset.reveal) || 0,
				}),
		});
	});
}

/** Teardown for bfcache/page swaps. */
export function destroyMotion(): void {
	for (const t of ScrollTrigger.getAll()) t.kill();
	gsap.killTweensOf("*");
	stopScroll();
}
