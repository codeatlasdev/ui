import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Page } from "@playwright/test";
import { expect, gotoReady, test } from "./fixtures";
import { DIST, ROUTES } from "./routes";

/**
 * Layout integrity on every prerendered page (desktop + mobile projects):
 * - the page never scrolls sideways (wide content scrolls in its own region);
 * - visible text and controls never overlap each other;
 * - text is never cut off by its box unless it shows an ellipsis or sits in a scroll region.
 * Decorative stacks (avatar groups, badges on anchors, PIN cells) overlap by design.
 */
const INTENTIONAL = ".ca-avatar-group, .ca-avatar, .ca-badge, .ca-pin, [class*='badge']";

// Meta-refresh redirect stubs render nothing; their targets are routes of their own.
const PAGES = ROUTES.filter(
	(r) => !readFileSync(join(DIST, r, "index.html"), "utf8").includes('http-equiv="refresh"')
);

async function audit(page: Page, isMobile: boolean): Promise<string[]> {
	const issues = await page.evaluate((intentional) => {
		const out: string[] = [];
		const de = document.documentElement;
		if (de.scrollWidth > de.clientWidth + 1)
			out.push(`page scrolls sideways by ${de.scrollWidth - de.clientWidth}px`);

		const shown = (e: Element) => {
			const closed = e.closest("details:not([open])");
			if (closed && !e.closest("summary")) return false;
			const s = getComputedStyle(e);
			// Visually hidden for assistive tech (1px box): not on screen, so not a layout defect.
			if (e.getBoundingClientRect().width <= 1 || e.getBoundingClientRect().height <= 1)
				return false;
			return s.visibility !== "hidden" && s.display !== "none" && Number(s.opacity) > 0.05;
		};
		const pinned = (e: Element) => {
			for (let a: Element | null = e; a; a = a.parentElement) {
				const p = getComputedStyle(a).position;
				if (p === "fixed" || p === "sticky") return true;
			}
			return false;
		};
		// Rect intersected with every clipping ancestor; null when clipped away or visually hidden.
		// Per line box: an inline element wrapping over two lines has a bounding rect that spans
		// its neighbours without touching them.
		const visibleRects = (e: Element) => {
			const rects =
				getComputedStyle(e).display === "inline"
					? [...e.getClientRects()]
					: [e.getBoundingClientRect()];
			return rects.map((r) => clipRect(e, r)).filter((x) => x !== null);
		};
		const clipRect = (e: Element, r: DOMRect) => {
			let [l, t, ri, b] = [r.left, r.top, r.right, r.bottom];
			for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) {
				const s = getComputedStyle(a);
				if (s.clipPath && s.clipPath !== "none") return null;
				if (s.overflowX !== "visible" || s.overflowY !== "visible") {
					const q = a.getBoundingClientRect();
					l = Math.max(l, q.left);
					t = Math.max(t, q.top);
					ri = Math.min(ri, q.right);
					b = Math.min(b, q.bottom);
				}
			}
			return ri - l > 2 && b - t > 2 ? { l, t, r: ri, b } : null;
		};
		const label = (e: Element) =>
			`${e.tagName.toLowerCase()}${e.classList[0] ? `.${e.classList[0]}` : ""}«${(e.textContent ?? "").trim().slice(0, 30)}»`;

		const textLeaves = [...document.querySelectorAll("main *, header *")].filter(
			(e) =>
				(e as HTMLElement).offsetWidth > 0 &&
				shown(e) &&
				[...e.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim()) &&
				!e.closest("pre, code, svg, [aria-hidden='true'], .ca-sr-only, .sr-only")
		);

		for (const e of textLeaves) {
			const s = getComputedStyle(e);
			const scrolls = s.overflowX === "auto" || s.overflowX === "scroll";
			if (
				s.overflowX !== "visible" &&
				!scrolls &&
				s.textOverflow !== "ellipsis" &&
				e.scrollWidth > e.clientWidth + 2
			)
				out.push(`clipped ${label(e)}`);
		}

		const boxes = [
			...new Set([
				...textLeaves,
				...document.querySelectorAll("main button, main a, main input, header button, header a"),
			]),
		]
			.filter((e) => shown(e) && !pinned(e) && !e.closest(intentional))
			.map((e) => [e, visibleRects(e)] as const)
			.filter((x) => x[1].length > 0);
		const hit = (p: { l: number; t: number; r: number; b: number }, q: typeof p) =>
			Math.min(p.r, q.r) - Math.max(p.l, q.l) > 3 && Math.min(p.b, q.b) - Math.max(p.t, q.t) > 3;
		for (let i = 0; i < boxes.length; i++)
			for (let j = i + 1; j < boxes.length; j++) {
				const [a, ra] = boxes[i];
				const [c, rc] = boxes[j];
				if (a.contains(c) || c.contains(a)) continue;
				if (ra.some((p) => rc.some((q) => hit(p, q))))
					out.push(`overlap ${label(a)} × ${label(c)}`);
			}
		return out.slice(0, 10);
	}, INTENTIONAL);
	if (isMobile) {
		// Touch targets: every visible control in the content is at least 44×44 (WCAG 2.5.5 / HIG).
		const small = await page.evaluate(() => {
			// Effective hit area: the element, its expanded ::after overlay, or (for a bare text
			// input) the field box that receives the tap.
			const hitArea = (e: Element): [number, number] => {
				const host = e.matches("input, select") ? (e.closest("[class*='__wrap'], label") ?? e) : e;
				const r = host.getBoundingClientRect();
				const a = getComputedStyle(e, "::after");
				const aw =
					a.content !== "none" && a.position === "absolute" ? Number.parseFloat(a.width) || 0 : 0;
				const ah =
					a.content !== "none" && a.position === "absolute" ? Number.parseFloat(a.height) || 0 : 0;
				return [Math.max(r.width, aw), Math.max(r.height, ah)];
			};
			return [
				...document.querySelectorAll(
					"main button, main [role='button'], main input:not([type=hidden]), main select, .ca-cal__day"
				),
			]
				.filter((e) => {
					const r = e.getBoundingClientRect();
					if (
						r.width < 2 ||
						r.height < 2 ||
						e.closest("details:not([open]), [aria-hidden='true'], .ca-sr-only, .sr-only")
					)
						return false;
					const s = getComputedStyle(e);
					if (s.visibility === "hidden" || s.display === "none" || Number(s.opacity) < 0.05)
						return false;
					const [w, h] = hitArea(e);
					return Math.min(w, h) < 43.5;
				})
				.slice(0, 8)
				.map((e) => {
					const [w, h] = hitArea(e);
					return `${e.tagName.toLowerCase()}.${e.classList[0] ?? ""} ${Math.round(w)}×${Math.round(h)}`;
				});
		});
		issues.push(...small.map((x) => `touch target < 44px: ${x}`));
	}
	return issues;
}

/** Sign-in pages bounce a signed-in user to the dashboard: measure them signed out. */
async function open(page: Page, route: string) {
	if (route.endsWith("/sign-in/"))
		await page.addInitScript(() => localStorage.removeItem("ca_auth"));
	await gotoReady(page, route);
}

for (const route of PAGES) {
	test(`layout ${route}`, async ({ page, isMobile }) => {
		// Narrowest common phone width: anything that fits at 360px fits on larger phones.
		if (isMobile) await page.setViewportSize({ width: 360, height: 780 });
		await open(page, route);
		expect(await audit(page, isMobile)).toEqual([]);
	});
}

// The theme editor shows one panel at a time below 900px: each must hold the same guarantees.
for (const panel of ["Controls", "Code"]) {
	test(`layout /theme/ (${panel} panel)`, async ({ page, isMobile }) => {
		test.skip(!isMobile, "panels are tabs only on narrow screens");
		await page.setViewportSize({ width: 360, height: 780 });
		await gotoReady(page, "/theme/");
		await page.getByRole("tab", { name: panel }).click();
		expect(await audit(page, isMobile)).toEqual([]);
	});
}

// Viewport sweep (viewport_complete §15.2): the in-between widths and a short landscape
// phone, where fixed heights and two-column breakpoints break first. Desktop project only:
// the device emulation stays fine-pointer, so this checks geometry, not touch targets.
const SWEEP = [
	{ name: "tablet 768", width: 768, height: 1024 },
	{ name: "laptop 1024", width: 1024, height: 768 },
	{ name: "landscape 844x390", width: 844, height: 390 },
] as const;
for (const vp of SWEEP) {
	for (const route of PAGES) {
		test(`layout ${route} @ ${vp.name}`, async ({ page, isMobile }) => {
			test.skip(isMobile, "sweep runs once, on the desktop project");
			await page.setViewportSize({ width: vp.width, height: vp.height });
			await open(page, route);
			expect(await audit(page, false)).toEqual([]);
		});
	}
}
