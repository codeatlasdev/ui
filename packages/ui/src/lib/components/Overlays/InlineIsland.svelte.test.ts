import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { SLOW_FLOW, settled } from "../../../../tests/settled";
import { toast } from "../../stores/toast.svelte.js";
import Harness from "./InlineIsland.test.svelte";

/**
 * #563: `inline` renders an overlay in place, inside a re-themed island: no move to <body>, no
 * top layer, no scroll lock, no focus trap, no global stack entry. It takes the island's tokens
 * and the page behind stays interactive.
 */

afterEach(() => {
	for (const t of [...toast.items]) toast.remove(t.id);
	document.documentElement.style.removeProperty("overflow");
});

const island = () => document.querySelector("[data-testid='island']") as HTMLElement;
const brand = (el: Element) => getComputedStyle(el).getPropertyValue("--ca-brand-main").trim();

async function mount() {
	const screen = await render(Harness);
	toast.show("Inline toast", { duration: 0 });
	await settled();
	return screen;
}

const SURFACES = [
	[".ca-dialog", "dialog"],
	[".ca-drawer", "drawer"],
	[".ca-sheet", "sheet"],
	[".ca-popover-content", "popover"],
	[".ca-dropdown-content", "menu"],
	[".ca-toaster", "toaster"],
] as const;

describe("inline overlays in a re-themed island", () => {
	it("render inside the island, in place, not in <body>", async () => {
		await mount();
		for (const [selector, name] of SURFACES) {
			const el = document.querySelector(selector);
			expect(el, `${name} is rendered`).not.toBeNull();
			expect(island().contains(el), `${name} is inside the island`).toBe(true);
		}
	});

	it("take the island's tokens, not the page's", async () => {
		await mount();
		const islandBrand = brand(island());
		const pageBrand = brand(document.documentElement);
		expect(islandBrand).not.toBe("");
		expect(islandBrand).not.toBe(pageBrand);
		for (const [selector, name] of SURFACES) {
			const el = document.querySelector(selector) as HTMLElement;
			expect(brand(el), `${name} resolves the island's brand`).toBe(islandBrand);
		}
	});

	it("never enter the top layer or become modal", async () => {
		await mount();
		for (const selector of [".ca-dialog", ".ca-drawer", ".ca-sheet"]) {
			const el = document.querySelector(selector) as HTMLDialogElement;
			expect(el.matches(":modal"), `${selector} is not :modal`).toBe(false);
			expect(el.hasAttribute("open"), `${selector} is shown without showModal`).toBe(true);
		}
		for (const selector of [".ca-popover-content", ".ca-dropdown-content"]) {
			const el = document.querySelector(selector) as HTMLElement;
			expect(el.matches(":popover-open"), `${selector} is not in the top layer`).toBe(false);
			expect(el.hasAttribute("popover"), `${selector} has no popover attribute`).toBe(false);
		}
	});

	it("are position: absolute inside their container", async () => {
		await mount();
		for (const selector of [".ca-dialog", ".ca-drawer", ".ca-sheet", ".ca-toaster"]) {
			const el = document.querySelector(selector) as HTMLElement;
			expect(getComputedStyle(el).position, `${selector} position`).toBe("absolute");
			const r = el.getBoundingClientRect();
			const c = island().getBoundingClientRect();
			expect(r.left).toBeGreaterThanOrEqual(c.left - 1);
			expect(r.right).toBeLessThanOrEqual(c.right + 1);
			expect(r.top).toBeGreaterThanOrEqual(c.top - 1);
			expect(r.bottom).toBeLessThanOrEqual(c.bottom + 1);
		}
	});

	it("do not lock page scroll", async () => {
		await mount();
		expect(document.body.style.overflow).not.toBe("hidden");
		expect(getComputedStyle(document.body).overflow).not.toBe("hidden");
	});

	it(
		"leave the page interactive: no inert, the page button still clicks",
		async () => {
			const screen = await mount();
			expect(document.querySelector("[inert]")).toBeNull();
			await screen.getByTestId("page-button").click({ timeout: 4000 });
			expect(document.querySelector("[data-testid='page-clicks']")?.textContent).toBe("1");
		},
		SLOW_FLOW
	);

	it(
		"do not trap focus: Tab can leave the dialog",
		async () => {
			await mount();
			const dialog = document.querySelector(".ca-dialog") as HTMLElement;
			const seen = new Set<Element | null>();
			for (let i = 0; i < 24; i++) {
				await userEvent.keyboard("{Tab}");
				seen.add(document.activeElement);
			}
			expect([...seen].some((el) => el && !dialog.contains(el))).toBe(true);
		},
		SLOW_FLOW
	);

	it(
		"do not own Escape globally: Escape elsewhere closes nothing",
		async () => {
			const screen = await mount();
			await screen.getByTestId("page-button").click({ timeout: 4000 });
			await userEvent.keyboard("{Escape}");
			await settled();
			expect(document.querySelector(".ca-dialog")).not.toBeNull();
			expect(document.querySelector(".ca-popover-content")).not.toBeNull();
			expect(document.querySelector(".ca-dropdown-content")).not.toBeNull();
		},
		SLOW_FLOW
	);

	it(
		"close with Escape from inside the layer",
		async () => {
			await mount();
			const close = document.querySelector(".ca-dialog .ca-layer-close") as HTMLElement;
			close.focus();
			await userEvent.keyboard("{Escape}");
			await expect.poll(() => document.querySelector(".ca-dialog")).toBeNull();
		},
		SLOW_FLOW
	);

	it(
		"do not close on a press outside",
		async () => {
			const screen = await mount();
			await screen.getByTestId("page-button").click({ timeout: 4000 });
			await settled();
			expect(document.querySelector(".ca-popover-content")).not.toBeNull();
			expect(document.querySelector(".ca-dropdown-content")).not.toBeNull();
		},
		SLOW_FLOW
	);
});
