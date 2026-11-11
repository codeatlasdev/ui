/** Options of {@link auditLayout}. */
export interface LayoutAuditOptions {
	/** Also check that every control in `main` is at least `--ca-touch-target` square (a phone viewport). */
	mobile?: boolean;
	/** Elements that overlap by design (avatar stacks, badges on an anchor), skipped by the overlap check. */
	intentional?: string;
}

/**
 * Layout integrity of the current page, as a list of problems (empty when clean): the page never scrolls
 * sideways; visible text and controls in `main` and `header` never overlap; text is never cut off by its box
 * unless it ends in an ellipsis or sits in a scroll region; with `mobile`, every control in `main` is at least
 * `--ca-touch-target` square. The same audit gates every page of the library's own site.
 *
 * Self-contained on purpose (no outer references, one plain-object argument), so Playwright can ship it into
 * the page: `expect(await page.evaluate(auditLayout, { mobile: true })).toEqual([])`. In Vitest browser mode or
 * any DOM, call it directly.
 */
export function auditLayout(options: LayoutAuditOptions = {}): string[] {
	const intentional =
		options.intentional ?? ".ca-avatar-group, .ca-avatar, .ca-badge, .ca-pin, [class*='badge']";
	const out: string[] = [];
	const de = document.documentElement;
	if (de.scrollWidth > de.clientWidth + 1)
		out.push(`page scrolls sideways by ${de.scrollWidth - de.clientWidth}px`);

	const shown = (e: Element) => {
		const closed = e.closest("details:not([open])");
		if (closed && !e.closest("summary")) return false;
		const s = getComputedStyle(e);
		// Visually hidden for assistive tech (1px box): not on screen, so not a layout defect.
		const r = e.getBoundingClientRect();
		if (r.width <= 1 || r.height <= 1) return false;
		return s.visibility !== "hidden" && s.display !== "none" && Number(s.opacity) > 0.05;
	};
	const pinned = (e: Element) => {
		for (let a: Element | null = e; a; a = a.parentElement) {
			const p = getComputedStyle(a).position;
			if (p === "fixed" || p === "sticky") return true;
		}
		return false;
	};
	type Box = { l: number; t: number; r: number; b: number };
	// Rect intersected with every clipping ancestor; null when clipped away.
	const clipRect = (e: Element, r: DOMRect): Box | null => {
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
	// Per line box: an inline element wrapping over two lines has a bounding rect that spans its neighbours.
	const visibleRects = (e: Element) =>
		(getComputedStyle(e).display === "inline"
			? [...e.getClientRects()]
			: [e.getBoundingClientRect()]
		)
			.map((r) => clipRect(e, r))
			.filter((x): x is Box => x !== null);
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
	const hit = (p: Box, q: Box) =>
		Math.min(p.r, q.r) - Math.max(p.l, q.l) > 3 && Math.min(p.b, q.b) - Math.max(p.t, q.t) > 3;
	for (let i = 0; i < boxes.length; i++)
		for (let j = i + 1; j < boxes.length; j++) {
			const [a, ra] = boxes[i];
			const [c, rc] = boxes[j];
			if (a.contains(c) || c.contains(a)) continue;
			if (ra.some((p) => rc.some((q) => hit(p, q)))) out.push(`overlap ${label(a)} × ${label(c)}`);
		}
	const issues = out.slice(0, 10);

	if (options.mobile) {
		// Touch targets (WCAG 2.5.5 / HIG): the minimum is the page's own --ca-touch-target.
		const probe = document.createElement("div");
		probe.style.cssText = "position:absolute;visibility:hidden;width:var(--ca-touch-target, 44px)";
		document.body.append(probe);
		const min = probe.getBoundingClientRect().width;
		probe.remove();
		// Effective hit area: the element, its expanded ::after overlay, or (a bare text input) the field box.
		const hitArea = (e: Element): [number, number] => {
			const host = e.matches("input, select") ? (e.closest("[class*='__wrap'], label") ?? e) : e;
			const r = host.getBoundingClientRect();
			const a = getComputedStyle(e, "::after");
			const over = a.content !== "none" && a.position === "absolute";
			return [
				Math.max(r.width, over ? Number.parseFloat(a.width) || 0 : 0),
				Math.max(r.height, over ? Number.parseFloat(a.height) || 0 : 0),
			];
		};
		const small = [
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
				return Math.min(w, h) < min - 0.5;
			})
			.slice(0, 8)
			.map((e) => {
				const [w, h] = hitArea(e);
				return `touch target < ${min}px: ${e.tagName.toLowerCase()}.${e.classList[0] ?? ""} ${Math.round(w)}×${Math.round(h)}`;
			});
		issues.push(...small);
	}
	return issues;
}
