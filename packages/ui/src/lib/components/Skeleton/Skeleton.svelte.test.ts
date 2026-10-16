/// <reference types="@vitest/browser-playwright" />
import { afterEach, describe, expect, it } from "vitest";
import { cdp } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import Skeleton from "./Skeleton.svelte";

const blocks = (c: HTMLElement) => [...c.querySelectorAll<HTMLElement>(".ca-skeleton")];

afterEach(async () => {
	await cdp().send("Emulation.setEmulatedMedia", { features: [] });
});

describe("Skeleton", () => {
	it("is hidden from assistive tech and passes axe", async () => {
		const screen = await render(Skeleton, {});
		const [el] = blocks(screen.container);
		expect(el.getAttribute("aria-hidden")).toBe("true");
		expect(screen.container.querySelector("[role]")).toBeNull();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it.each(["text", "circular", "rectangular", "rounded"] as const)(
		"variant %s is rendered and hidden",
		async (variant) => {
			const screen = await render(Skeleton, { variant, width: 40, height: 40 });
			const [el] = blocks(screen.container);
			expect(el.classList.contains(`ca-skeleton--${variant}`)).toBe(true);
			expect(el.getAttribute("aria-hidden")).toBe("true");
		}
	);

	it("numeric width/height become px; strings pass through", async () => {
		const num = await render(Skeleton, { width: 120, height: 32 });
		const [a] = blocks(num.container);
		expect(a.getBoundingClientRect().width).toBe(120);
		expect(a.getBoundingClientRect().height).toBe(32);
		const str = await render(Skeleton, { width: "50%", height: "2rem" });
		const [b] = blocks(str.container);
		expect(b.style.width).toBe("50%");
		expect(b.style.height).toBe("2rem");
	});

	it("circular with equal size is a circle", async () => {
		const screen = await render(Skeleton, { variant: "circular", width: 48, height: 48 });
		const [el] = blocks(screen.container);
		expect(getComputedStyle(el).borderTopLeftRadius).toBe("50%");
	});

	it("rows renders N hidden lines and shortens the last text line to 60%", async () => {
		const screen = await render(Skeleton, { rows: 3, width: "200px" });
		const els = blocks(screen.container);
		expect(els).toHaveLength(3);
		for (const el of els) expect(el.getAttribute("aria-hidden")).toBe("true");
		expect(els[0].style.width).toBe("200px");
		expect(els[1].style.width).toBe("200px");
		expect(els[2].style.width).toBe("60%");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("rows of non-text variants keep the full width on the last line", async () => {
		const screen = await render(Skeleton, {
			rows: 2,
			variant: "rectangular",
			width: "200px",
			height: 10,
		});
		const els = blocks(screen.container);
		expect(els).toHaveLength(2);
		expect(els[1].style.width).toBe("200px");
	});

	it("rows=1 renders a single block without a wrapper", async () => {
		const screen = await render(Skeleton, { rows: 1 });
		expect(blocks(screen.container)).toHaveLength(1);
		expect(screen.container.querySelector(".ca-skeleton-rows")).toBeNull();
	});

	it("shimmer is a translated pseudo-element, never an animated background", async () => {
		const screen = await render(Skeleton, { width: 120, height: 16 });
		const [el] = blocks(screen.container);
		const host = el.getAnimations().flatMap((a) => (a as CSSAnimation).animationName);
		expect(host).not.toContain("ca-shimmer");
		const sweep = el
			.getAnimations({ subtree: true })
			.find((a) => (a.effect as KeyframeEffect).pseudoElement === "::after");
		if (!sweep) throw new Error("no animation on ::after");
		expect((sweep as CSSAnimation).animationName).toBe("ca-shimmer");
		const frames = (sweep.effect as KeyframeEffect).getKeyframes();
		expect(frames.some((f) => "transform" in f || "translate" in f)).toBe(true);
		expect(frames.some((f) => "backgroundPosition" in f)).toBe(false);
		expect(getComputedStyle(el).overflow).toBe("hidden");
	});

	it("reduced motion removes the sweep", async () => {
		await cdp().send("Emulation.setEmulatedMedia", {
			features: [{ name: "prefers-reduced-motion", value: "reduce" }],
		});
		const screen = await render(Skeleton, { width: 120, height: 16 });
		const [el] = blocks(screen.container);
		expect(el.getAnimations({ subtree: true })).toHaveLength(0);
	});
});
