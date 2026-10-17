import { afterEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { toast } from "../../stores/toast.svelte.js";
import Harness from "./Entrances.test.svelte";

const root = document.documentElement;

/** Longest animation or transition duration (ms) running on `el`. */
const longest = (el: Element | null): number => {
	if (!el) return Number.NaN;
	const cs = getComputedStyle(el);
	const ms = (v: string) =>
		Math.max(...v.split(",").map((s) => Number.parseFloat(s) * (s.includes("ms") ? 1 : 1000)));
	return Math.max(ms(cs.animationDuration), ms(cs.transitionDuration));
};

afterEach(() => {
	root.style.removeProperty("--ca-enter-scale");
	for (const t of [...toast.items]) toast.remove(t.id);
});

// #268: `motion.enter: "none"` zeroes entrance/exit animations only; hover/focus color transitions stay.
describe("--ca-enter-scale: 0 removes entrances and keeps color transitions", () => {
	const SURFACES: Record<string, string> = {
		Dialog: "dialog.ca-dialog",
		Drawer: "dialog.ca-drawer",
		Sheet: "dialog.ca-sheet",
		CommandPalette: "dialog.ca-cmd-dialog",
	};

	for (const [name, sel] of Object.entries(SURFACES)) {
		it(`${name} opens in place`, async () => {
			root.style.setProperty("--ca-enter-scale", "0");
			await render(Harness, { only: name });
			await expect.poll(() => document.querySelector(sel)).not.toBeNull();
			expect(longest(document.querySelector(sel))).toBe(0);
			expect(
				longest(document.querySelector(`${sel}::backdrop`) ?? document.querySelector(sel))
			).toBe(0);
		});

		it(`${name} still animates with the default scale`, async () => {
			await render(Harness, { only: name });
			await expect.poll(() => document.querySelector(sel)).not.toBeNull();
			expect(longest(document.querySelector(sel))).toBeGreaterThan(0);
		});
	}

	it("DropdownMenu opens in place", async () => {
		root.style.setProperty("--ca-enter-scale", "0");
		const screen = await render(Harness, { only: "DropdownMenu" });
		await screen.getByRole("button", { name: "Actions" }).click();
		await expect.poll(() => document.querySelector(".ca-dropdown-content")).not.toBeNull();
		expect(longest(document.querySelector(".ca-dropdown-content"))).toBe(0);
	});

	it("Popover opens in place", async () => {
		root.style.setProperty("--ca-enter-scale", "0");
		const screen = await render(Harness, { only: "Popover" });
		await screen.getByRole("button", { name: "Details" }).click();
		await expect.poll(() => document.querySelector(".ca-popover-content")).not.toBeNull();
		expect(longest(document.querySelector(".ca-popover-content"))).toBe(0);
	});

	it("Tooltip opens in place", async () => {
		root.style.setProperty("--ca-enter-scale", "0");
		const screen = await render(Harness, { only: "Tooltip" });
		await screen.getByText("Hint").hover();
		await expect.poll(() => document.querySelector(".ca-tooltip-content")).not.toBeNull();
		expect(longest(document.querySelector(".ca-tooltip-content"))).toBe(0);
	});

	it("Toast appears in place", async () => {
		root.style.setProperty("--ca-enter-scale", "0");
		const screen = await render(Harness, { only: "Toast" });
		toast.info("Saved", 0);
		await expect.element(screen.getByRole("status")).toBeVisible();
		expect(longest(document.querySelector(".ca-toast"))).toBe(0);
	});

	it("a Button keeps its color transition", async () => {
		root.style.setProperty("--ca-enter-scale", "0");
		const screen = await render(Harness, { only: "none" });
		expect(longest(screen.getByRole("button", { name: "Hover me" }).element())).toBeGreaterThan(0);
	});
});
