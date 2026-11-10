import { afterEach, describe, expect, it, vi } from "vitest";
import { cdp, page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { settled } from "../../../../tests/settled";
import { touchTarget } from "../../../../tests/touch-target";
import Harness from "./AppShellBrand.test.svelte";

// #733: `brandHref` makes the shell own the brand link: one <a> per surface (rail on desktop, header on
// a phone), named by `brandLabel`, with a 44px hit area that is an overhang, not layout.
const links = () => [...document.querySelectorAll<HTMLAnchorElement>("a.ca-shell-brand")];
const shown = (el: Element) =>
	el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";

afterEach(async () => {
	await cdp().send("Emulation.setTouchEmulationEnabled", { enabled: false });
});

describe("AppShellLayout brandHref (#733)", () => {
	it("renders the brand as a link named by brandLabel in the rail and in the mobile header", async () => {
		await page.viewport(1280, 720);
		await render(Harness, { brandHref: "/app/dashboard", brandLabel: "Acme, home" });
		expect(links()).toHaveLength(2);
		for (const a of links()) {
			expect(a.getAttribute("href")).toBe("/app/dashboard");
			expect(a.getAttribute("aria-label")).toBe("Acme, home");
		}
		// Desktop shows the rail's, a phone the header's.
		expect(links().filter(shown)).toHaveLength(1);
		await page.viewport(390, 844);
		await expect.poll(() => links().filter(shown).length).toBe(1);
	});

	it("without brandHref the markup is unchanged: no link", async () => {
		await render(Harness, {});
		expect(links()).toHaveLength(0);
		expect(document.querySelector('[data-testid="logo"]')).not.toBeNull();
	});

	it("on a coarse pointer the link's hit area is 44px square while the logo stays 28px", async () => {
		await page.viewport(390, 844);
		await cdp().send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
		await render(Harness, { brandHref: "/app/dashboard", brandLabel: "Acme, home" });
		expect(matchMedia("(pointer: coarse)").matches).toBe(true);
		const a = links().find(shown) as HTMLAnchorElement;
		const logo = a.querySelector<HTMLElement>('[data-testid="logo"]') as HTMLElement;
		expect(logo.getBoundingClientRect().width).toBe(28);
		const min = touchTarget();
		const r = a.getBoundingClientRect();
		const cx = r.left + r.width / 2;
		const cy = r.top + r.height / 2;
		for (const [dx, dy] of [
			[-1, -1],
			[1, -1],
			[-1, 1],
			[1, 1],
		]) {
			const el = document.elementFromPoint(cx + dx * (min / 2 - 1), cy + dy * (min / 2 - 1));
			expect(el?.closest("a.ca-shell-brand"), `corner ${dx},${dy}`).toBe(a);
		}
	});

	it("keyboard focus shows the focus ring on the link", async () => {
		await page.viewport(390, 844);
		await render(Harness, { brandHref: "/app/dashboard", brandLabel: "Acme, home" });
		const a = links().find(shown) as HTMLAnchorElement;
		a.focus({ focusVisible: true } as FocusOptions);
		expect(Number.parseFloat(getComputedStyle(a).outlineWidth)).toBeGreaterThan(0);
		expect(getComputedStyle(a).outlineStyle).not.toBe("none");
	});

	it("dev: an interactive brand under the touch target on a coarse pointer logs one warning", async () => {
		await page.viewport(390, 844);
		await cdp().send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		try {
			// The silent case first: devWarn prints once per key per page, so after the warning case a silent result
			// would prove nothing. The check runs on a frame after mount: settled() waits for it, no fixed sleep.
			await render(Harness, { brandHref: "/app/dashboard", brandLabel: "Acme, home" });
			await settled();
			expect(warn.mock.calls.filter((c) => String(c[0]).includes("brandHref"))).toHaveLength(0);
			await render(Harness, { ownLink: true });
			await expect
				.poll(() => warn.mock.calls.filter((c) => String(c[0]).includes("brandHref")).length)
				.toBe(1);
		} finally {
			warn.mockRestore();
		}
	});
});
