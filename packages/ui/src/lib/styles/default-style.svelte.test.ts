import { createRawSnippet } from "svelte";
import { afterEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import Chip from "../components/Chip/Chip.svelte";
import Skeleton from "../components/Skeleton/Skeleton.svelte";
import Surface from "../components/Surface/Surface.svelte";

// #564: a page that never sets `data-style` (an app without the theme plugin, like Atlas) must
// render exactly as `data-style="solid"`, the package default: no blur, solid surfaces.
const html = document.documentElement;
const prior = html.getAttribute("data-style");
afterEach(() =>
	prior === null ? html.removeAttribute("data-style") : html.setAttribute("data-style", prior)
);

const body = createRawSnippet(() => ({ render: () => `<p>Content</p>` }));
const PROPS = [
	"backdropFilter",
	"webkitBackdropFilter",
	"backgroundColor",
	"backgroundImage",
	"boxShadow",
	"borderTopColor",
	"borderTopWidth",
] as const;

function look(el: Element) {
	const cs = getComputedStyle(el) as CSSStyleDeclaration & Record<string, string>;
	return Object.fromEntries(PROPS.map((p) => [p, cs[p] ?? ""]));
}

/** A chip, a thin/regular/thick/chrome blur role and every Surface material="auto" tier. */
async function targets() {
	const chip = await render(Chip, { label: "Design" });
	const out: Record<string, Element> = {
		chip: chip.container.querySelector(".ca-chip") as Element,
	};
	for (const role of [
		"ultra-thin",
		"thin",
		"regular",
		"thick",
		"chrome",
		"overlay",
		"chrome-layer",
	]) {
		const host = document.createElement("div");
		host.dataset.caBlur = role;
		document.body.append(host);
		out[`role-${role}`] = host;
	}
	for (const elevation of [0, 1, 2, 3, 4, 5] as const) {
		const s = await render(Surface, { elevation, children: body });
		out[`surface-${elevation}`] = s.container.firstElementChild as Element;
	}
	return out;
}

describe("no data-style behaves as data-style=solid (#564)", () => {
	it("skeleton pulses instead of sweeping, like solid", async () => {
		const anim = async () => {
			const screen = await render(Skeleton, { variant: "rectangular", height: 48 });
			const el = screen.container.querySelector(".ca-skeleton") as Element;
			return [getComputedStyle(el).animationName, getComputedStyle(el, "::after").content];
		};
		html.setAttribute("data-style", "solid");
		const solid = await anim();
		html.removeAttribute("data-style");
		const bare = await anim();
		expect(solid[0]).toBe("ca-skeleton-pulse");
		expect(bare).toEqual(solid);
	});

	for (const scheme of ["light", "dark"] as const) {
		it(`blur roles, chip and auto surfaces match solid (${scheme})`, async () => {
			html.classList.toggle("dark", scheme === "dark");
			try {
				const els = await targets();

				html.setAttribute("data-style", "solid");
				const solid = Object.fromEntries(Object.entries(els).map(([k, e]) => [k, look(e)]));

				html.removeAttribute("data-style");
				const bare = Object.fromEntries(Object.entries(els).map(([k, e]) => [k, look(e)]));

				expect(bare.chip?.backdropFilter).toBe("none");
				for (const [name, snap] of Object.entries(bare)) {
					expect(snap, name).toEqual(solid[name]);
				}
				for (const name of Object.keys(bare)) els[name]?.remove();
			} finally {
				html.classList.remove("dark");
			}
		});
	}
});
