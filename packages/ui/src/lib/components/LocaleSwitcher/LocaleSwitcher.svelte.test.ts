import { describe, expect, it, vi } from "vitest";
import { cdp, page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { touchTarget } from "../../../../tests/touch-target";
import LocaleSwitcher from "./LocaleSwitcher.svelte";
import Bound from "./LocaleSwitcherBound.test.svelte";
import Header from "./LocaleSwitcherHeader.test.svelte";
import Tokens from "./LocaleSwitcherTokens.test.svelte";

const options = [
	{ value: "pt-BR", label: "Português", short: "PT" },
	{ value: "en", label: "English" },
	{ value: "es", label: "Español", lang: "es-419" },
];

describe("LocaleSwitcher", () => {
	it("opens a menu of native names, the current one checked, each with its lang", async () => {
		await page.viewport(1280, 800);
		const screen = await render(LocaleSwitcher, { options, value: "pt-BR" });
		await screen.getByRole("button", { name: /Language/ }).click();
		const pt = screen.getByRole("menuitemradio", { name: "Português" });
		await expect.element(pt).toHaveAttribute("aria-checked", "true");
		await expect
			.element(screen.getByRole("menuitemradio", { name: "English" }))
			.toHaveAttribute("aria-checked", "false");
		await expect.element(pt).toHaveAttribute("lang", "pt-BR");
		await expect
			.element(screen.getByRole("menuitemradio", { name: "Español" }))
			.toHaveAttribute("lang", "es-419");
		expect(await checkA11y(document.body)).toHaveNoViolations();
	});

	it("shows the native name on desktop and the short code on a phone", async () => {
		const screen = await render(LocaleSwitcher, { options, value: "pt-BR" });
		const trigger = screen.getByRole("button", { name: /Language/ }).element();
		const visible = (sel: string) =>
			getComputedStyle(trigger.querySelector(sel) as HTMLElement).display !== "none";
		await page.viewport(1280, 800);
		expect(visible(".ca-locale__name")).toBe(true);
		expect(visible(".ca-locale__code")).toBe(false);
		await page.viewport(390, 800);
		expect(visible(".ca-locale__name")).toBe(false);
		expect(visible(".ca-locale__code")).toBe(true);
		expect((trigger.querySelector(".ca-locale__code") as HTMLElement).textContent).toBe("PT");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("derives the short code from the value and keeps the visible text in the name", async () => {
		await page.viewport(1280, 800);
		const screen = await render(LocaleSwitcher, { options, value: "en" });
		const trigger = screen.getByRole("button", { name: /English/ });
		await expect.element(trigger).toBeVisible();
		expect((trigger.element().querySelector(".ca-locale__code") as HTMLElement).textContent).toBe(
			"EN"
		);
	});

	it("compact forces the short code at any width", async () => {
		await page.viewport(1280, 800);
		const screen = await render(LocaleSwitcher, { options, value: "pt-BR", compact: true });
		const trigger = screen.getByRole("button", { name: /Language/ }).element();
		expect(getComputedStyle(trigger.querySelector(".ca-locale__name") as HTMLElement).display).toBe(
			"none"
		);
		expect(
			getComputedStyle(trigger.querySelector(".ca-locale__code") as HTMLElement).display
		).not.toBe("none");
	});

	it("awaits an async onselect, shows busy, then commits and closes", async () => {
		let done!: () => void;
		const onselect = vi.fn(() => new Promise<void>((r) => (done = r)));
		const screen = await render(Bound, { options, onselect });
		await screen.getByRole("button", { name: /Language/ }).click();
		await screen.getByRole("menuitemradio", { name: "English" }).click();
		expect(onselect).toHaveBeenCalledWith("en");
		const trigger = screen.getByRole("button", { name: /Language/ });
		await expect.element(trigger).toHaveAttribute("aria-busy", "true");
		await expect.element(screen.getByTestId("value")).toHaveTextContent("pt-BR");
		done();
		await expect.element(screen.getByTestId("value")).toHaveTextContent("en");
		await expect.element(trigger).not.toHaveAttribute("aria-busy", "true");
		await vi.waitFor(() => expect(screen.getByRole("menu").elements()).toHaveLength(0));
	});

	it("keeps the current value and reports when onselect rejects", async () => {
		const err = new Error("save failed");
		const onerror = vi.fn();
		const screen = await render(Bound, {
			options,
			onselect: () => Promise.reject(err),
			onerror,
		});
		await screen.getByRole("button", { name: /Language/ }).click();
		await screen.getByRole("menuitemradio", { name: "English" }).click();
		await vi.waitFor(() => expect(onerror).toHaveBeenCalledWith(err));
		await expect.element(screen.getByTestId("value")).toHaveTextContent("pt-BR");
		await expect
			.element(screen.getByRole("button", { name: /Language/ }))
			.not.toHaveAttribute("aria-busy", "true");
	});

	it("picking the current locale does not call onselect", async () => {
		const onselect = vi.fn();
		const screen = await render(Bound, { options, onselect });
		await screen.getByRole("button", { name: /Language/ }).click();
		await screen.getByRole("menuitemradio", { name: "Português" }).click();
		expect(onselect).not.toHaveBeenCalled();
	});

	it("works from the keyboard", async () => {
		const onselect = vi.fn();
		const screen = await render(Bound, { options, onselect });
		screen
			.getByRole("button", { name: /Language/ })
			.element()
			.focus();
		await userEvent.keyboard("{ArrowDown}");
		await expect.element(screen.getByRole("menuitemradio", { name: "Português" })).toHaveFocus();
		await userEvent.keyboard("{ArrowDown}{Enter}");
		await vi.waitFor(() => expect(onselect).toHaveBeenCalledWith("en"));
	});

	it("composes in a SiteHeader trailing slot next to a CTA without overflow", async () => {
		for (const w of [390, 1280]) {
			await page.viewport(w, 800);
			const screen = await render(Header);
			const header = screen.getByRole("banner").element() as HTMLElement;
			const inner = header.querySelector(".ca-site-header__inner") as HTMLElement;
			expect(inner.scrollWidth).toBeLessThanOrEqual(inner.clientWidth);
			const trailing = header.querySelector(".ca-site-header__trailing") as HTMLElement;
			expect(trailing.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
			await expect.element(screen.getByRole("link", { name: "Sign up" })).toBeVisible();
			expect(await checkA11y(screen.container)).toHaveNoViolations();
			screen.unmount();
		}
	});

	describe("size, icon and tokens (#690)", () => {
		const trigger = () => document.querySelector(".ca-locale") as HTMLElement;
		const box = () => trigger().getBoundingClientRect();
		const svgs = () => [...trigger().querySelectorAll("svg")];
		const cs = (el: Element) => getComputedStyle(el);

		it("unset: 36px control height, weight 500, 16px globe, 14px chevron", async () => {
			await page.viewport(1280, 800);
			await render(Tokens, {});
			const [icon, chevron] = svgs();
			expect(box().height).toBe(36);
			expect(cs(trigger()).fontWeight).toBe("500");
			expect(icon.getBoundingClientRect().width).toBe(16);
			expect(chevron.getBoundingClientRect().width).toBe(14);
		});

		it("size sm follows --ca-control-height-sm and the caption scale", async () => {
			await page.viewport(1280, 800);
			await render(Tokens, { size: "sm" });
			const sm = parseFloat(
				getComputedStyle(document.documentElement).getPropertyValue("--ca-control-height-sm")
			);
			expect(box().height).toBe(sm);
			const probe = document.body.appendChild(document.createElement("i"));
			probe.style.fontSize = "var(--ca-font-size-caption)";
			expect(cs(trigger()).fontSize).toBe(cs(probe).fontSize);
			probe.remove();
		});

		it("tokens alone set height, weight, icon sizes, padding and gap, no .ca-locale selector", async () => {
			await page.viewport(1280, 800);
			await render(Tokens, {
				tokens: {
					"--ca-locale-height": "32px",
					"--ca-locale-font-weight": "400",
					"--ca-locale-icon-size": "20px",
					"--ca-locale-chevron-size": "18px",
					"--ca-locale-padding-x": "12px",
					"--ca-locale-gap": "10px",
				},
			});
			const [icon, chevron] = svgs();
			expect(box().height).toBe(32);
			expect(cs(trigger()).fontWeight).toBe("400");
			expect(icon.getBoundingClientRect().width).toBe(20);
			expect(icon.getBoundingClientRect().height).toBe(20);
			expect(chevron.getBoundingClientRect().width).toBe(18);
			expect(cs(trigger()).paddingLeft).toBe("12px");
			expect(cs(trigger()).columnGap).toBe("10px");
		});

		it("the compact header tokens: 36px tall, width = 8 + 14 + 6 + text + 6 + 16 + 8", async () => {
			await page.viewport(1280, 800);
			const { Languages } = await import("@lucide/svelte");
			await render(Tokens, {
				icon: Languages,
				tokens: {
					"--ca-locale-height": "36px",
					"--ca-locale-font-weight": "400",
					"--ca-locale-icon-size": "14px",
					"--ca-locale-chevron-size": "16px",
					"--ca-locale-padding-x": "8px",
					"--ca-locale-gap": "6px",
					"--ca-font-size-body2": "14px",
				},
			});
			const text = (
				trigger().querySelector(".ca-locale__name") as HTMLElement
			).getBoundingClientRect().width;
			expect(cs(trigger()).fontSize).toBe("14px");
			expect(box().height).toBe(36);
			expect(box().width).toBeCloseTo(8 + 14 + 6 + text + 6 + 16 + 8, 1);
		});

		it("a token beats the size default", async () => {
			await page.viewport(1280, 800);
			await render(Tokens, { size: "sm", tokens: { "--ca-locale-height": "40px" } });
			expect(box().height).toBe(40);
		});

		it("icon replaces the leading globe", async () => {
			await page.viewport(1280, 800);
			const { Languages } = await import("@lucide/svelte");
			await render(Tokens, { icon: Languages });
			expect(trigger().querySelector(".lucide-languages")).not.toBeNull();
			expect(trigger().querySelector(".lucide-globe")).toBeNull();
		});

		it("coarse pointer: hit area stays at the touch target", async () => {
			await page.viewport(390, 844);
			await cdp().send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
			try {
				await render(Tokens, { size: "sm", tokens: { "--ca-locale-height": "32px" } });
				expect(matchMedia("(pointer: coarse)").matches).toBe(true);
				const min = touchTarget();
				const r = box();
				const cx = r.left + r.width / 2;
				const cy = r.top + r.height / 2;
				expect(r.height).toBe(32);
				// 32px visual box, 44px hit area: a point 5px below the box still hits the trigger.
				const el = document.elementFromPoint(cx, r.bottom + (min - r.height) / 2 - 1);
				expect(el?.closest(".ca-locale")).toBe(trigger());
			} finally {
				await cdp().send("Emulation.setTouchEmulationEnabled", { enabled: false });
			}
		});

		it("is axe-clean with size sm and a custom icon", async () => {
			const { Languages } = await import("@lucide/svelte");
			const screen = await render(Tokens, { size: "sm", icon: Languages });
			expect(await checkA11y(screen.container)).toHaveNoViolations();
		});
	});
});
