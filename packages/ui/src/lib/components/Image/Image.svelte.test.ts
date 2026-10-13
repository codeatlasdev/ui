import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { q } from "../../../../tests/dom";
import Image from "./Image.svelte";

const base = { src: "/hero.png", alt: "Dashboard", width: 400, height: 200 };

afterEach(() => {
	vi.restoreAllMocks();
	for (const l of document.head.querySelectorAll('link[rel="preload"][as="image"]')) l.remove();
});

describe("Image", () => {
	it("reserves the aspect ratio and loads lazily by default", async () => {
		const screen = await render(Image, base);
		const img = q<HTMLImageElement>(screen.container, "img");
		expect(img.getAttribute("width")).toBe("400");
		expect(img.getAttribute("height")).toBe("200");
		expect(img.loading).toBe("lazy");
		expect(img.decoding).toBe("async");
		expect(img.getAttribute("fetchpriority")).toBeNull();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("keeps the width/height ratio when max-width shrinks the box", async () => {
		const screen = await render(Image, {
			...base,
			src: "data:image/gif;base64,R0lGODlhAQABAAAAACw=",
			style: "width:100px",
		});
		const img = q<HTMLImageElement>(screen.container, "img");
		expect(getComputedStyle(img).height).toBe("50px");
	});

	it("priority loads eagerly with high fetch priority and preloads in <head>", async () => {
		const screen = await render(Image, {
			...base,
			priority: true,
			srcset: "/hero-400.png 400w, /hero-800.png 800w",
			sizes: "100vw",
		});
		const img = q<HTMLImageElement>(screen.container, "img");
		expect(img.loading).toBe("eager");
		expect(img.getAttribute("fetchpriority")).toBe("high");
		const link = document.head.querySelector('link[rel="preload"][as="image"]');
		expect(link?.getAttribute("href")).toBe("/hero.png");
		expect(link?.getAttribute("imagesrcset")).toBe("/hero-400.png 400w, /hero-800.png 800w");
		expect(link?.getAttribute("imagesizes")).toBe("100vw");
	});

	it("an explicit loading wins over the priority default", async () => {
		const screen = await render(Image, { ...base, priority: true, loading: "lazy" });
		expect(q<HTMLImageElement>(screen.container, "img").loading).toBe("lazy");
	});

	it("decorative renders an empty alt, hidden from assistive tech, without warning", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const screen = await render(Image, { ...base, alt: "", decorative: true });
		const img = q<HTMLImageElement>(screen.container, "img");
		expect(img.getAttribute("alt")).toBe("");
		expect(img.getAttribute("aria-hidden")).toBe("true");
		expect(warn).not.toHaveBeenCalled();
	});

	it('warns in dev for alt="" without decorative, and for missing dimensions', async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		await render(Image, { ...base, alt: "" });
		expect(
			warn.mock.calls.some(
				(c) => String(c[0]).includes('alt=""') && String(c[0]).includes("decorative")
			)
		).toBe(true);
		warn.mockClear();
		await render(Image, { src: "/x.png", alt: "x" } as never);
		expect(warn.mock.calls.some((c) => String(c[0]).includes("width and height"))).toBe(true);
	});

	it("does not warn for a well-formed image", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		await render(Image, base);
		expect(warn).not.toHaveBeenCalled();
	});
});
