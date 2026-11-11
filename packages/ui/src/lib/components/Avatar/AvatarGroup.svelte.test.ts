import { afterEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { q } from "../../../../tests/dom";
import { setLocale } from "../../i18n/state.svelte";
import AvatarGroup from "./AvatarGroup.svelte";
import AvatarGroupChildren from "./AvatarGroupChildren.test.svelte";

// 1x1 transparent GIF so the image really loads in Chromium
const PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

const qa = <T extends Element = HTMLElement>(root: ParentNode, selector: string) => [
	...root.querySelectorAll<T>(selector),
];

const items = [
	{ name: "Ana Lima", src: PIXEL },
	{ name: "Bruno Souza" },
	{ name: "Carla Dias" },
	{ name: "Diego Alves" },
	{ name: "Eva Rocha" },
];

afterEach(() => setLocale("en"));

describe("AvatarGroup", () => {
	it("is a labelled group; each avatar keeps its name", async () => {
		const screen = await render(AvatarGroup, { items: items.slice(0, 3), label: "Reviewers" });
		await expect.element(screen.getByRole("group", { name: "Reviewers" })).toBeVisible();
		await expect.element(screen.getByRole("img", { name: "Ana Lima" })).toBeInTheDocument();
		expect(qa(screen.container, ".ca-avatar")).toHaveLength(3);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("shows max avatars and a +N chip named 'N more'", async () => {
		const screen = await render(AvatarGroup, { items, max: 3 });
		expect(qa(screen.container, ".ca-avatar:not(.ca-avatar-group__more)")).toHaveLength(3);
		const chip = screen.getByRole("img", { name: "2 more" });
		await expect.element(chip).toBeVisible();
		await expect.element(chip).toHaveTextContent("+2");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("hidden avatars are not in the page, only counted", async () => {
		const screen = await render(AvatarGroup, { items, max: 2 });
		await expect.element(screen.getByText("DA")).not.toBeInTheDocument();
		await expect.element(screen.getByRole("img", { name: "3 more" })).toBeInTheDocument();
	});

	it("renders no chip when everything fits", async () => {
		const screen = await render(AvatarGroup, { items, max: 5 });
		expect(screen.container.querySelector(".ca-avatar-group__more")).toBeNull();
		const noMax = await render(AvatarGroup, { items });
		expect(noMax.container.querySelector(".ca-avatar-group__more")).toBeNull();
	});

	it("localizes the group name and the chip (pt-BR)", async () => {
		setLocale("pt-BR");
		const screen = await render(AvatarGroup, { items, max: 3 });
		await expect.element(screen.getByRole("group", { name: "Avatares" })).toBeVisible();
		await expect.element(screen.getByRole("img", { name: "mais 2" })).toBeVisible();
	});

	it("moreLabel overrides the chip's accessible name", async () => {
		const screen = await render(AvatarGroup, {
			items,
			max: 3,
			moreLabel: (n: number) => `${n} other reviewers`,
		});
		await expect.element(screen.getByRole("img", { name: "2 other reviewers" })).toBeVisible();
	});

	it.each([
		["xs", 20],
		["sm", 28],
		["md", 36],
		["lg", 48],
		["xl", 64],
		[52, 52],
	] as const)("size %s matches Avatar (%ipx), chip included", async (size, px) => {
		const screen = await render(AvatarGroup, { items, max: 2, size });
		for (const el of qa<HTMLElement>(screen.container, ".ca-avatar")) {
			const box = el.getBoundingClientRect();
			expect(box.width).toBe(px);
			expect(box.height).toBe(px);
		}
	});

	it("overlaps by --ca-avatar-group-overlap", async () => {
		const screen = await render(AvatarGroup, { items: items.slice(0, 2), size: "md" });
		const group = q<HTMLElement>(screen.container, ".ca-avatar-group");
		group.style.setProperty("--ca-avatar-group-overlap", "10px");
		const [a, b] = qa<HTMLElement>(screen.container, ".ca-avatar");
		expect(a.getBoundingClientRect().right - b.getBoundingClientRect().left).toBe(10);
	});

	it("default overlap is a share of the size, so every size overlaps", async () => {
		const screen = await render(AvatarGroup, { items: items.slice(0, 2), size: "lg" });
		const [a, b] = qa<HTMLElement>(screen.container, ".ca-avatar");
		expect(a.getBoundingClientRect().right).toBeGreaterThan(b.getBoundingClientRect().left);
	});

	it("rings every avatar with --ca-avatar-group-ring", async () => {
		const screen = await render(AvatarGroup, { items: items.slice(0, 2) });
		const group = q<HTMLElement>(screen.container, ".ca-avatar-group");
		group.style.setProperty("--ca-avatar-group-ring", "rgb(255, 0, 0)");
		const item = q<HTMLElement>(screen.container, ".ca-avatar-group__item");
		expect(getComputedStyle(item).boxShadow).toContain("rgb(255, 0, 0)");
	});

	it("earlier avatars stack above later ones", async () => {
		const screen = await render(AvatarGroup, { items: items.slice(0, 2), size: "md" });
		const [a, b] = qa<HTMLElement>(screen.container, ".ca-avatar-group__item");
		const at = a.getBoundingClientRect();
		const top = document.elementFromPoint(at.right - 2, at.top + at.height / 2);
		expect(a.contains(top)).toBe(true);
		expect(b.contains(top)).toBe(false);
	});

	it("takes avatars as children, each keeping its own name", async () => {
		const screen = await render(AvatarGroupChildren);
		await expect.element(screen.getByRole("group", { name: "Reviewers" })).toBeVisible();
		await expect.element(screen.getByRole("img", { name: "Bruno Souza" })).toBeInTheDocument();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("an empty group renders nothing", async () => {
		const screen = await render(AvatarGroup, { items: [] });
		expect(screen.container.querySelector(".ca-avatar-group")).toBeNull();
	});
});
