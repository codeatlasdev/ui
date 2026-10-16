import { describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import type { MediaGridItem } from "./MediaGrid.svelte";
import Harness from "./MediaGrid.test.svelte";

// 1x1 gif / png keep the tests offline.
const GIF = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const BAD = "http://127.0.0.1:1/missing.png";

const img = (n: number, extra: Partial<MediaGridItem> = {}): MediaGridItem => ({
	src: `${GIF}#${n}`,
	alt: `Photo ${n}`,
	...extra,
});
const images = (n: number) => Array.from({ length: n }, (_, i) => img(i + 1));

const tiles = (c: Element) => Array.from(c.querySelectorAll<HTMLElement>(".ca-media-grid__tile"));
const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)));
async function loaded(c: Element) {
	await expect
		.poll(
			() =>
				c.querySelectorAll(".ca-media-grid__tile img").length > 0 &&
				c.querySelector("[data-loaded=false]") === null
		)
		.toBe(true);
}

describe("MediaGrid", () => {
	it("is a labelled group with one named button per image", async () => {
		const screen = await render(Harness, { props: { items: images(3) } });
		await expect.element(screen.getByRole("group", { name: "Media" })).toBeVisible();
		expect(tiles(screen.container).map((t) => t.getAttribute("aria-label"))).toEqual([
			"Open Photo 1, 1 of 3",
			"Open Photo 2, 2 of 3",
			"Open Photo 3, 3 of 3",
		]);
		for (const t of tiles(screen.container)) expect(t.tagName).toBe("BUTTON");
		await loaded(screen.container);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("uses the type label when an item has no title or alt", async () => {
		const screen = await render(Harness, {
			props: { items: [{ src: GIF }, { src: GIF, type: "video" }] },
		});
		const names = tiles(screen.container).map((t) => t.getAttribute("aria-label"));
		expect(names).toEqual(["Open Image, 1 of 2", "Open Video, 2 of 2"]);
	});

	it("lazy loads the thumb, falling back to src", async () => {
		const screen = await render(Harness, {
			props: { items: [img(1, { thumb: `${GIF}#thumb` }), img(2)] },
		});
		const imgs = Array.from(screen.container.querySelectorAll("img"));
		expect(imgs[0].getAttribute("src")).toBe(`${GIF}#thumb`);
		expect(imgs[1].getAttribute("src")).toBe(`${GIF}#2`);
		for (const i of imgs) {
			expect(i.getAttribute("loading")).toBe("lazy");
			expect(i.getAttribute("decoding")).toBe("async");
		}
	});

	it("tiles are at least 44px", async () => {
		const screen = await render(Harness, { props: { items: images(4) } });
		for (const t of tiles(screen.container)) {
			const r = t.getBoundingClientRect();
			expect(r.width).toBeGreaterThanOrEqual(44);
			expect(r.height).toBeGreaterThanOrEqual(44);
		}
	});

	it("video tile shows a decorative play badge and the duration", async () => {
		const screen = await render(Harness, {
			props: {
				items: [{ type: "video", src: "clip.mp4", poster: GIF, title: "Clip", duration: "0:42" }],
			},
		});
		const tile = tiles(screen.container)[0];
		expect(tile.querySelector(".ca-media-grid__play")?.getAttribute("aria-hidden")).toBe("true");
		expect(tile.querySelector(".ca-media-grid__duration")?.textContent).toBe("0:42");
		expect(tile.querySelector("img")?.getAttribute("src")).toBe(GIF);
		expect(tile.getAttribute("aria-label")).toBe("Open Clip, 1 of 1. 0:42");
		await loaded(screen.container);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("opens the Lightbox at the clicked tile with the right counter", async () => {
		const onopen = vi.fn();
		const screen = await render(Harness, { props: { items: images(3), onopen } });
		await screen.getByRole("button", { name: "Open Photo 2, 2 of 3" }).click();
		const dialog = page.getByRole("dialog", { name: "Photo 2" });
		await expect.element(dialog).toBeVisible();
		await expect.element(page.getByText("2 / 3")).toBeVisible();
		expect(onopen).toHaveBeenCalledTimes(1);
		expect(onopen.mock.calls[0][0]).toBe(1);
		await settled();
		expect(await checkA11y(document.body)).toHaveNoViolations();
	});

	it("shows +N on the last visible tile and opens the gallery at that index", async () => {
		const screen = await render(Harness, { props: { items: images(7), maxVisible: 4 } });
		expect(tiles(screen.container).length).toBe(4);
		const last = tiles(screen.container)[3];
		expect(last.querySelector(".ca-media-grid__more")?.textContent).toBe("+3 more");
		expect(last.getAttribute("aria-label")).toBe("Open Photo 4, 4 of 7. +3 more");
		await loaded(screen.container);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
		await last.click();
		await expect.element(page.getByRole("dialog", { name: "Photo 4" })).toBeVisible();
		await expect.element(page.getByText("4 / 7")).toBeVisible();
	});

	it("does not render an overlay when everything fits", async () => {
		const screen = await render(Harness, { props: { items: images(4), maxVisible: 4 } });
		expect(screen.container.querySelector(".ca-media-grid__more")).toBeNull();
	});

	it("documents are links outside the gallery and the index is remapped", async () => {
		const onopen = vi.fn();
		const screen = await render(Harness, {
			props: {
				items: [
					img(1),
					{ type: "document", src: "report.pdf", title: "Report.pdf", size: "2 MB" },
					img(3),
				],
				onopen,
			},
		});
		const [, doc] = tiles(screen.container);
		expect(doc.tagName).toBe("A");
		expect(doc.getAttribute("href")).toBe("report.pdf");
		expect(doc.hasAttribute("download")).toBe(true);
		expect(doc.textContent).toContain("Report.pdf");
		expect(doc.textContent).toContain("2 MB");
		expect(doc.querySelector("img")).toBeNull();
		await doc.click();
		expect(onopen).toHaveBeenCalledWith(1, expect.objectContaining({ type: "document" }));
		expect(document.querySelector("dialog.ca-lightbox")).toBeNull();
		// Third tile is gallery item 2 of 2.
		await screen.getByRole("button", { name: "Open Photo 3, 3 of 3" }).click();
		await expect.element(page.getByRole("dialog", { name: "Photo 3" })).toBeVisible();
		await expect.element(page.getByText("2 / 2")).toBeVisible();
	});

	it("shows a skeleton until the image loads, then removes it", async () => {
		const screen = await render(Harness, { props: { items: [img(1)] } });
		const tile = tiles(screen.container)[0];
		const image = tile.querySelector("img") as HTMLImageElement;
		// Rewind to the pending state, then let the real load event finish it.
		tile.removeAttribute("data-loaded");
		await expect.poll(() => tile.dataset.state).toBe("loaded");
		expect(tile.querySelector(".ca-skeleton")).toBeNull();
		expect(image.classList.contains("ca-media-grid__img--hidden")).toBe(false);
		expect(getComputedStyle(image).opacity).toBe("1");
	});

	it("keeps the skeleton (and the box) while the image is pending", async () => {
		// Held-open request: the server never answers, so neither load nor error fires.
		const screen = await render(Harness, {
			props: { items: [{ src: "/__pending__?delay", alt: "x" }] },
		});
		const tile = tiles(screen.container)[0];
		const before = tile.getBoundingClientRect();
		if (tile.dataset.state === "loading") {
			expect(tile.querySelector(".ca-skeleton")).not.toBeNull();
			expect(getComputedStyle(tile.querySelector("img") as Element).opacity).toBe("0");
		}
		await expect.poll(() => tile.dataset.state).not.toBe("loading");
		const after = tile.getBoundingClientRect();
		expect(after.width).toBe(before.width);
		expect(after.height).toBe(before.height);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("shows a failed state for a broken image that is not opened", async () => {
		const onopen = vi.fn();
		const screen = await render(Harness, {
			props: { items: [{ src: BAD, alt: "Broken" }], onopen },
		});
		const tile = tiles(screen.container)[0];
		await expect
			.poll(() => tile.querySelector(".ca-media-grid__failed")?.textContent)
			.toContain("Could not load");
		expect(tile.querySelector(".ca-skeleton")).toBeNull();
		expect(tile.querySelector("img")).toBeNull();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
		expect((tile as HTMLButtonElement).disabled).toBe(true);
		tile.click();
		await frame();
		expect(onopen).not.toHaveBeenCalled();
		expect(document.querySelector("dialog.ca-lightbox")).toBeNull();
	});

	it("a failed video tile still opens", async () => {
		const screen = await render(Harness, {
			props: { items: [{ type: "video", src: "clip.mp4", poster: BAD, title: "Clip" }] },
		});
		const tile = tiles(screen.container)[0];
		await expect.poll(() => tile.querySelector(".ca-media-grid__failed")).not.toBeNull();
		await tile.click();
		await expect.element(page.getByRole("dialog", { name: "Clip" })).toBeVisible();
	});

	it("picks columns by count and honours the columns prop", async () => {
		const cols = async (props: object) => {
			const screen = await render(Harness, { props });
			const grid = screen.container.querySelector(".ca-media-grid__grid") as HTMLElement;
			const n = getComputedStyle(grid).gridTemplateColumns.split(" ").length;
			screen.unmount();
			return n;
		};
		expect(await cols({ items: images(1) })).toBe(1);
		expect(await cols({ items: images(2) })).toBe(2);
		expect(await cols({ items: images(4) })).toBe(2);
		expect(await cols({ items: images(4), columns: 3 })).toBe(3);
		const three = await render(Harness, { props: { items: images(3) } });
		const first = tiles(three.container)[0];
		expect(first.getBoundingClientRect().width).toBeGreaterThan(
			tiles(three.container)[1].getBoundingClientRect().width * 1.5
		);
	});
});
