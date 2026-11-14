import { createRawSnippet } from "svelte";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import IconButton from "./IconButton.svelte";

const icon = createRawSnippet(() => ({
	render: () => `<svg aria-hidden="true" width="16" height="16"></svg>`,
}));

describe("IconButton", () => {
	it("is named by aria-label and calls onclick", async () => {
		const onclick = vi.fn();
		const screen = await render(IconButton, { "aria-label": "Close", children: icon, onclick });
		await screen.getByRole("button", { name: "Close" }).click();
		expect(onclick).toHaveBeenCalledOnce();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("loading sets aria-busy, disables and blocks onclick", async () => {
		const onclick = vi.fn();
		const screen = await render(IconButton, {
			"aria-label": "Save",
			children: icon,
			loading: true,
			onclick,
		});
		const btn = screen.getByRole("button", { name: "Save" });
		await expect.element(btn).toHaveAttribute("aria-busy", "true");
		await expect.element(btn).toBeDisabled();
		await btn.click({ force: true });
		expect(onclick).not.toHaveBeenCalled();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("disabled blocks onclick without aria-busy", async () => {
		const onclick = vi.fn();
		const screen = await render(IconButton, {
			"aria-label": "Edit",
			children: icon,
			disabled: true,
			onclick,
		});
		const btn = screen.getByRole("button", { name: "Edit" });
		await expect.element(btn).toBeDisabled();
		await expect.element(btn).not.toHaveAttribute("aria-busy");
		await btn.click({ force: true });
		expect(onclick).not.toHaveBeenCalled();
	});

	it.each(["glass", "filled", "ghost"] as const)(
		"variant %s keeps the button accessible",
		async (variant) => {
			const screen = await render(IconButton, {
				"aria-label": "Action",
				children: icon,
				variant,
				size: "lg",
			});
			await expect.element(screen.getByRole("button", { name: "Action" })).toBeVisible();
			expect(await checkA11y(screen.container)).toHaveNoViolations();
		}
	);

	it("warns in dev when no accessible name is given", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		// Bypasses the required `aria-label` type, as a JS caller or spread would.
		const props = { children: icon } as unknown as Parameters<typeof render<typeof IconButton>>[1];
		await render(IconButton, props);
		expect(warn).toHaveBeenCalledWith(
			expect.stringMatching(/^\[ca-ui\] <IconButton> has no accessible name/)
		);
		warn.mockRestore();
	});

	it("stays quiet when aria-label names it", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		await render(IconButton, { "aria-label": "Ok", children: icon });
		expect(warn).not.toHaveBeenCalled();
		warn.mockRestore();
	});
});

describe("IconButton tone=neutral (#357)", () => {
	it("outlined: border and icon are neutral, not the brand colour", async () => {
		const brand = await render(IconButton, {
			"aria-label": "A",
			children: icon,
			variant: "outlined",
		});
		const neutral = await render(IconButton, {
			"aria-label": "B",
			children: icon,
			variant: "outlined",
			tone: "neutral",
			"aria-expanded": false,
		});
		const b = getComputedStyle(brand.container.querySelector("button") as HTMLElement);
		const nEl = neutral.container.querySelector("button") as HTMLElement;
		const n = getComputedStyle(nEl);
		expect(n.color).not.toBe(b.color);
		expect(n.borderTopColor).not.toBe(b.borderTopColor);
		expect(nEl.getAttribute("aria-expanded")).toBe("false");
		expect(await checkA11y(neutral.container)).toHaveNoViolations();
	});

	it("disabled outlined neutral keeps the shared disabled look", async () => {
		const screen = await render(IconButton, {
			"aria-label": "Off",
			children: icon,
			variant: "outlined",
			tone: "neutral",
			disabled: true,
		});
		const probe = document.createElement("span");
		probe.style.color = "var(--ca-text-disabled)";
		document.body.append(probe);
		expect(getComputedStyle(screen.getByRole("button").element()).color).toBe(
			getComputedStyle(probe).color
		);
		probe.remove();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});

// #708: IconButton has the same four disabled tokens as Button (`--ca-icon-btn-disabled-*`).
describe("IconButton configurable disabled look (#708)", () => {
	const css = (el: Element, prop: string) => getComputedStyle(el).getPropertyValue(prop);

	it("defaults to no dimming; the tokens set opacity, colour and border", async () => {
		const screen = await render(IconButton, {
			"aria-label": "Favourite",
			children: icon,
			variant: "outlined",
			disabled: true,
		});
		const btn = screen.container.querySelector("button") as HTMLElement;
		expect(css(btn, "opacity")).toBe("1");
		btn.style.setProperty("--ca-icon-btn-disabled-opacity", "0.5");
		btn.style.setProperty("--ca-icon-btn-disabled-color", "rgb(1, 2, 3)");
		btn.style.setProperty("--ca-icon-btn-disabled-border-color", "rgb(4, 5, 6)");
		btn.style.setProperty("--ca-icon-btn-disabled-border-width", "3px");
		// The button transitions colour, border and opacity (150 ms): read the end state, not the first frame.
		await settled();
		expect(css(btn, "opacity")).toBe("0.5");
		expect(css(btn, "color")).toBe("rgb(1, 2, 3)");
		expect(css(btn, "border-top-color")).toBe("rgb(4, 5, 6)");
		expect(css(btn, "border-top-width")).toBe("3px");
	});
});

describe("IconButton link form (#686)", () => {
	const phone = createRawSnippet(() => ({ render: () => "<svg aria-hidden='true'></svg>" }));

	it("href renders a real link with the icon button look", async () => {
		const screen = await render(IconButton, {
			"aria-label": "Call Ana",
			href: "tel:+5511999990000",
			children: phone,
		});
		const link = screen.getByRole("link", { name: "Call Ana" });
		await expect.element(link).toHaveAttribute("href", "tel:+5511999990000");
		expect(link.element().classList).toContain("ca-icon-btn");
		expect(screen.container.querySelector("button")).toBeNull();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it('target="_blank" adds noopener noreferrer', async () => {
		// `target` is also a render option, so the props go under `props`.
		const screen = await render(IconButton, {
			props: {
				"aria-label": "Open in maps",
				href: "https://maps.example.com/?q=1",
				target: "_blank",
				children: phone,
			},
		});
		const rel = screen.getByRole("link").element().getAttribute("rel") ?? "";
		expect(rel).toContain("noopener");
		expect(rel).toContain("noreferrer");
	});

	it("a disabled link is out of the tab order and does not navigate", async () => {
		const onclick = vi.fn();
		const screen = await render(IconButton, {
			"aria-label": "Call",
			href: "tel:1",
			disabled: true,
			onclick,
			children: phone,
		});
		const link = screen.container.querySelector("a") as HTMLAnchorElement;
		expect(link.getAttribute("aria-disabled")).toBe("true");
		expect(link.tabIndex).toBe(-1);
		const event = new MouseEvent("click", { bubbles: true, cancelable: true });
		link.dispatchEvent(event);
		expect(event.defaultPrevented).toBe(true);
		expect(onclick).not.toHaveBeenCalled();
	});
});

// #1233: the background-less variant was `ghost` on Button and `text` on IconButton, so code written for
// one failed the type check on the other. `ghost` is the name on both; `text` stays as a deprecated alias.
describe("IconButton ghost variant", () => {
	it("ghost is the background-less look and text its deprecated alias", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		try {
			const a = await render(IconButton, {
				"aria-label": "Ghost",
				children: icon,
				variant: "ghost",
			});
			const ghost = a.getByRole("button", { name: "Ghost" }).element();
			expect(warn).not.toHaveBeenCalled();
			const b = await render(IconButton, { "aria-label": "Text", children: icon, variant: "text" });
			const legacy = b.getByRole("button", { name: "Text" }).element();
			for (const el of [ghost, legacy]) {
				expect(el.classList.contains("ca-icon-btn--ghost")).toBe(true);
				expect(el.classList.contains("ca-icon-btn--text")).toBe(true);
			}
			expect(getComputedStyle(ghost).color).toBe(getComputedStyle(legacy).color);
			expect(getComputedStyle(ghost).backgroundColor).toBe("rgba(0, 0, 0, 0)");
			expect(warn).toHaveBeenCalledWith(expect.stringContaining('variant="text"'));
		} finally {
			warn.mockRestore();
		}
	});
});
