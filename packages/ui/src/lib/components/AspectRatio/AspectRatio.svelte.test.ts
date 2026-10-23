import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { q } from "../../../../tests/dom";
import Image from "../Image/Image.svelte";
import Harness from "./AspectRatio.test.svelte";

const PX = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";

describe("AspectRatio", () => {
	it("holds the box at ratio 16/9 whatever the width", async () => {
		const screen = await render(Harness, { ratio: 16 / 9, width: 320 });
		const box = q(screen.container, ".ca-aspect");
		expect(Math.round(box.getBoundingClientRect().height)).toBe(180);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("reflows when the ratio changes", async () => {
		const screen = await render(Harness, { ratio: 1, width: 200 });
		const box = q(screen.container, ".ca-aspect");
		expect(Math.round(box.getBoundingClientRect().height)).toBe(200);
		await screen.rerender({ ratio: 2, width: 200 });
		expect(Math.round(box.getBoundingClientRect().height)).toBe(100);
	});

	it("stretches a media child over the box and crops it by default", async () => {
		const screen = await render(Harness, { ratio: 2, width: 200 });
		const media = q(screen.container, ".ca-aspect > .media");
		expect(Math.round(media.getBoundingClientRect().height)).toBe(100);
		expect(getComputedStyle(media).objectFit).toBe("cover");
	});

	it("a long child cannot grow the box past the ratio", async () => {
		const screen = await render(Harness, { ratio: 2, width: 200, tall: true });
		const box = q(screen.container, ".ca-aspect");
		expect(Math.round(box.getBoundingClientRect().height)).toBe(100);
	});

	it("carries no role of its own: it is layout, not a landmark", async () => {
		const screen = await render(Harness, { ratio: 1, width: 100 });
		const box = q(screen.container, ".ca-aspect");
		expect(box.getAttribute("role")).toBeNull();
		expect(box.hasAttribute("aria-label")).toBe(false);
	});
});

describe("Image ratio", () => {
	const base = { src: PX, alt: "Cover", width: 400, height: 200 };

	it("crops to the ratio instead of the intrinsic size, filling the width", async () => {
		const screen = await render(Image, { ...base, ratio: 1, style: "width:200px" });
		const img = q<HTMLImageElement>(screen.container, "img");
		const r = img.getBoundingClientRect();
		expect(Math.round(r.width)).toBe(200);
		expect(Math.round(r.height)).toBe(200);
		expect(getComputedStyle(img).objectFit).toBe("cover");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("fit=contain letterboxes inside the ratio box", async () => {
		const screen = await render(Image, { ...base, ratio: 1, fit: "contain", style: "width:200px" });
		const img = q<HTMLImageElement>(screen.container, "img");
		expect(getComputedStyle(img).objectFit).toBe("contain");
	});

	it("without ratio it keeps the width/height ratio and no object-fit crop", async () => {
		const screen = await render(Image, { ...base, style: "width:100px" });
		const img = q<HTMLImageElement>(screen.container, "img");
		expect(Math.round(img.getBoundingClientRect().height)).toBe(50);
		expect(getComputedStyle(img).objectFit).toBe("fill");
	});
});
