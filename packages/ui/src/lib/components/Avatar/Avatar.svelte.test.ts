import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { q } from "../../../../tests/dom";
import Avatar from "./Avatar.svelte";
import AvatarIcon from "./AvatarIcon.test.svelte";

// 1x1 transparent GIF so the image really loads in Chromium
const PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

const root = (c: HTMLElement) => q<HTMLElement>(c, ".ca-avatar");

describe("Avatar", () => {
	it("falls back to two initials from first and last word of alt", async () => {
		const screen = await render(Avatar, { alt: "Ana Maria Lima" });
		await expect.element(screen.getByText("AL")).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("single-word alt yields the first two letters, uppercased", async () => {
		const screen = await render(Avatar, { alt: "ana" });
		await expect.element(screen.getByText("AN")).toBeVisible();
	});

	it("explicit fallback overrides initials derived from alt", async () => {
		const screen = await render(Avatar, { alt: "Ana Lima", fallback: "Zed Quux" });
		await expect.element(screen.getByText("ZQ")).toBeVisible();
		await expect.element(screen.getByText("AL")).not.toBeInTheDocument();
	});

	it("empty alt without fallback shows '?'", async () => {
		const screen = await render(Avatar, {});
		await expect.element(screen.getByText("?")).toBeVisible();
	});

	it("renders the image with alt text once loaded", async () => {
		const screen = await render(Avatar, { src: PIXEL, alt: "Ana Lima" });
		const img = screen.getByRole("img", { name: "Ana Lima" });
		await expect.element(img).toBeInTheDocument();
		await expect.element(img).toHaveAttribute("src", PIXEL);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("keeps initials when the image fails to load", async () => {
		const screen = await render(Avatar, { src: "http://127.0.0.1:1/missing.png", alt: "Ana Lima" });
		await expect.element(screen.getByText("AL")).toBeVisible();
	});

	it("renders a real <img> with loading, referrerpolicy and crossorigin (no probe)", async () => {
		const screen = await render(Avatar, {
			src: PIXEL,
			alt: "Ana Lima",
			loading: "lazy",
			referrerpolicy: "no-referrer",
			crossorigin: "anonymous",
		});
		const img = screen.container.querySelector<HTMLImageElement>("img.ca-avatar__img");
		expect(img).not.toBeNull();
		expect(img?.getAttribute("loading")).toBe("lazy");
		expect(img?.getAttribute("referrerpolicy")).toBe("no-referrer");
		expect(img?.getAttribute("crossorigin")).toBe("anonymous");
	});

	it("does not fetch src through a detached Image()", async () => {
		const created: HTMLImageElement[] = [];
		const Native = window.Image;
		window.Image = class extends Native {
			constructor(w?: number, h?: number) {
				super(w, h);
				created.push(this);
			}
		} as typeof Image;
		try {
			await render(Avatar, { src: PIXEL, alt: "Ana Lima" });
		} finally {
			window.Image = Native;
		}
		expect(created).toHaveLength(0);
	});

	it("onerror fires and the string fallback shows", async () => {
		let failed = 0;
		const screen = await render(Avatar, {
			src: "http://127.0.0.1:1/missing.png",
			alt: "Ana Lima",
			onerror: () => failed++,
		});
		await expect.element(screen.getByText("AL")).toBeVisible();
		expect(failed).toBe(1);
		expect(screen.container.querySelector("img")).toBeNull();
	});

	it("renders a Snippet fallback (icon) instead of initials", async () => {
		const screen = await render(AvatarIcon, {
			src: "http://127.0.0.1:1/missing.png",
			alt: "Familia",
		});
		await expect.element(screen.getByTestId("fallback-icon")).toBeVisible();
		expect(screen.container.querySelector(".ca-avatar__fallback")?.textContent).not.toContain("FA");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it.each([
		["xs", 20],
		["sm", 28],
		["md", 36],
		["lg", 48],
		["xl", 64],
		[52, 52],
	] as const)("size %s renders at %ipx", async (size, px) => {
		const screen = await render(Avatar, { alt: "Ana Lima", size });
		const box = root(screen.container).getBoundingClientRect();
		expect(box.width).toBe(px);
		expect(box.height).toBe(px);
	});

	it("circle is fully round; rounded uses a smaller radius", async () => {
		const circle = await render(Avatar, { alt: "Ana Lima", size: "xl", shape: "circle" });
		expect(getComputedStyle(root(circle.container)).borderTopLeftRadius).toBe("50%");
		const rounded = await render(Avatar, { alt: "Ana Lima", size: "xl", shape: "rounded" });
		expect(getComputedStyle(root(rounded.container)).borderTopLeftRadius).toBe("14px");
	});

	it("derives the same colour for the same name", async () => {
		const a = await render(Avatar, { alt: "Ana Lima" });
		const b = await render(Avatar, { alt: "Ana Lima" });
		expect(root(a.container).style.getPropertyValue("--av-bg")).toBe(
			root(b.container).style.getPropertyValue("--av-bg")
		);
	});

	it.each([
		["online", "Online"],
		["offline", "Offline"],
		["busy", "Busy"],
		["away", "Away"],
	] as const)("status %s is exposed as a labelled image", async (status, name) => {
		const screen = await render(Avatar, { alt: "Ana Lima", status });
		await expect.element(screen.getByRole("img", { name })).toBeInTheDocument();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("renders no status indicator when status is omitted", async () => {
		const screen = await render(Avatar, { alt: "Ana Lima" });
		expect(screen.container.querySelector(".ca-avatar__status")).toBeNull();
	});
});
