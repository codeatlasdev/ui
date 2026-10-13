// Landing choreography. Booted on idle from index.astro. The HTML/CSS is already the final state;
// this only adds: word rises, reveals, chapter rail + progress, a scrubbed preset morph on desktop.
// Cleanup runs on pagehide (bfcache safe).
import {
	destroyMotion,
	gsap,
	reduced,
	reveals,
	riseHeadings,
	ScrollTrigger,
	startScroll,
	touch,
} from "./motion";

const doc = document.documentElement;
const $$ = <T extends Element>(s: string) => [...document.querySelectorAll<T>(s)];

export function boot(): void {
	// The rail is state, not motion: it runs for everyone.
	const stopRail = chapterRail();
	addEventListener(
		"pagehide",
		() => {
			stopRail();
			destroyMotion();
		},
		{ once: true }
	);
	if (reduced()) return;

	startScroll();
	riseHeadings();
	reveals();
	heroIntro();
	if (!touch()) themeScrub();

	// Fonts and islands change layout after first paint.
	document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

/** The strike-and-rewrite headline: old phrase is struck, the new one is written over it. */
function heroIntro(): void {
	const old = document.querySelector<HTMLElement>("[data-old]");
	const next = document.querySelector<HTMLElement>("[data-new]");
	if (!old || !next) return;
	const tl = gsap.timeline({ delay: 0.25, defaults: { ease: "power3.out" } });
	// Only the headline gesture animates. The lead, the actions and the stage are content:
	// they are painted by the server and never hidden again (hiding them on idle boot made
	// them blink out and return seconds later).
	tl.fromTo(old, { "--strike": 0 }, { "--strike": 1, duration: 0.7, ease: "power2.inOut" }).fromTo(
		next,
		{ clipPath: "inset(0 100% 0 0)" },
		{ clipPath: "inset(0 0% 0 0)", duration: 0.9, ease: "power2.inOut" },
		"+=0.1"
	);
}

/**
 * Desktop only: as the theme chapter scrolls through, step the demo frame through presets.
 * Scrubbed by progress; state is derived from progress so scrolling back reverses it.
 */
function themeScrub(): void {
	const frame = document.querySelector<HTMLElement>("[data-scrub-preset]");
	const section = document.querySelector<HTMLElement>("#theme");
	if (!frame || !section) return;
	const order = (frame.dataset.scrubPreset ?? "").split(",").filter(Boolean);
	if (order.length < 2) return;
	let last = -1;
	ScrollTrigger.create({
		trigger: section,
		start: "top 55%",
		end: "bottom 45%",
		onUpdate: (self) => {
			const i = Math.min(order.length - 1, Math.floor(self.progress * order.length));
			if (i === last) return;
			last = i;
			frame.setAttribute("data-preset", order[i]);
			frame.dataset.scrubIndex = String(i);
		},
	});
}

/** Chapter rail: aria-current follows the section under the viewport middle, hairline fills with progress. */
function chapterRail(): () => void {
	const links = $$<HTMLAnchorElement>("[data-rail]");
	const chapters = $$<HTMLElement>("[data-chapter]");
	if (!links.length || !chapters.length) return () => {};
	let cur = "";
	const update = () => {
		const mid = innerHeight / 2;
		const first = chapters[0].getBoundingClientRect().top;
		const end = chapters[chapters.length - 1].getBoundingClientRect().bottom;
		doc.classList.toggle("rail-on", first < innerHeight * 0.4 && end > mid);
		doc.style.setProperty(
			"--rail-progress",
			Math.min(1, Math.max(0, (mid - first) / (end - first))).toFixed(3)
		);
		const hit =
			chapters.find((s) => {
				const r = s.getBoundingClientRect();
				return r.top <= mid && r.bottom > mid;
			})?.dataset.chapter ?? "";
		if (hit === cur) return;
		cur = hit;
		for (const a of links) {
			if (hit && a.dataset.rail === hit) a.setAttribute("aria-current", "true");
			else a.removeAttribute("aria-current");
		}
	};
	update();
	addEventListener("scroll", update, { passive: true });
	addEventListener("resize", update, { passive: true });
	return () => {
		removeEventListener("scroll", update);
		removeEventListener("resize", update);
	};
}

/**
 * Frames start empty and get their src when they come within about half a screen of the viewport.
 * Runs for everyone (reduced motion, touch): it saves the embed's script and layout cost until it is useful.
 * Without JS the frame stays empty, so a plain link next to it is the fallback (see index.astro).
 */
export function lazyFrames(): void {
	const frames = $$<HTMLIFrameElement>("iframe[data-src]");
	if (!frames.length) return;
	const io = new IntersectionObserver(
		(entries) => {
			for (const e of entries) {
				if (!e.isIntersecting) continue;
				const f = e.target as HTMLIFrameElement;
				f.src = f.dataset.src ?? "";
				io.unobserve(f);
			}
		},
		{ rootMargin: "40% 0px" }
	);
	for (const f of frames) io.observe(f);
	addEventListener("pagehide", () => io.disconnect(), { once: true });
}
