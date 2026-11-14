import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { VIEWPORTS } from "../../../../tests/viewports";
import TabsHarness from "./TabsHarness.test.svelte";
import TabsIcon from "./TabsIcon.test.svelte";
import TabsOverflow from "./TabsOverflow.test.svelte";
import TabsViews from "./TabsViews.test.svelte";

describe("Tabs", () => {
	it("marks the active tab and shows only its panel", async () => {
		const screen = await render(TabsHarness, {});
		const account = screen.getByRole("tab", { name: "Account" });
		const password = screen.getByRole("tab", { name: "Password" });
		await expect.element(account).toHaveAttribute("aria-selected", "true");
		await expect.element(password).toHaveAttribute("aria-selected", "false");
		await expect.element(screen.getByRole("tabpanel")).toMatchTextContent("Account panel");
		await expect.element(screen.getByText("Password panel")).not.toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("uses roving tabindex: only the active tab is tabbable", async () => {
		const screen = await render(TabsHarness, {});
		await expect
			.element(screen.getByRole("tab", { name: "Account" }))
			.toHaveAttribute("tabindex", "0");
		await expect
			.element(screen.getByRole("tab", { name: "Password" }))
			.toHaveAttribute("tabindex", "-1");
		await expect
			.element(screen.getByRole("tab", { name: "Team" }))
			.toHaveAttribute("tabindex", "-1");
	});

	it("clicking a tab switches content, bound value and fires onchange", async () => {
		const onchange = vi.fn();
		const screen = await render(TabsHarness, { onchange });
		await screen.getByRole("tab", { name: "Password" }).click();
		await expect
			.element(screen.getByRole("tab", { name: "Password" }))
			.toHaveAttribute("aria-selected", "true");
		await expect.element(screen.getByRole("tabpanel")).toMatchTextContent("Password panel");
		await expect.element(screen.getByTestId("value")).toHaveTextContent("b");
		expect(onchange).toHaveBeenCalledWith("b");
	});

	it("arrow keys move focus (skipping disabled) and wrap around", async () => {
		const screen = await render(TabsHarness, {});
		const account = screen.getByRole("tab", { name: "Account" });
		(account.element() as HTMLElement).focus();
		await userEvent.keyboard("{ArrowRight}");
		await expect.element(screen.getByRole("tab", { name: "Password" })).toHaveFocus();
		// Billing is disabled → next stop is Team
		await userEvent.keyboard("{ArrowRight}");
		await expect.element(screen.getByRole("tab", { name: "Team" })).toHaveFocus();
		await userEvent.keyboard("{ArrowRight}");
		await expect.element(account).toHaveFocus();
		await userEvent.keyboard("{ArrowLeft}");
		await expect.element(screen.getByRole("tab", { name: "Team" })).toHaveFocus();
	});

	it("keyboard activation selects the focused tab", async () => {
		const screen = await render(TabsHarness, {});
		(screen.getByRole("tab", { name: "Account" }).element() as HTMLElement).focus();
		await userEvent.keyboard("{ArrowRight}");
		await userEvent.keyboard("{Enter}");
		await expect
			.element(screen.getByRole("tab", { name: "Password" }))
			.toHaveAttribute("aria-selected", "true");
		await expect.element(screen.getByRole("tabpanel")).toMatchTextContent("Password panel");
	});

	it("disabled tab cannot be selected", async () => {
		const screen = await render(TabsHarness, {});
		const billing = screen.getByRole("tab", { name: "Billing" });
		await expect.element(billing).toBeDisabled();
		await billing.click({ force: true });
		await expect.element(screen.getByTestId("value")).toHaveTextContent("a");
	});

	it("tab and panel reference each other", async () => {
		const screen = await render(TabsHarness, {});
		const tab = screen.getByRole("tab", { name: "Account" }).element();
		const panel = screen.getByRole("tabpanel").element();
		expect(tab.getAttribute("aria-controls")).toBe(panel.id);
		expect(panel.getAttribute("aria-labelledby")).toBe(tab.id);
	});
});

describe("TabsList overflow", () => {
	it("scrolls inside itself on a phone instead of widening the page", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		const screen = await render(TabsOverflow, {});
		const list = screen.getByRole("tablist").element() as HTMLElement;
		expect(list.scrollWidth).toBeGreaterThan(list.clientWidth);
		expect(list.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
		expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
		expect(getComputedStyle(list).overflowX).toBe("auto");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("keeps its intrinsic width on desktop instead of spanning the column", async () => {
		await page.viewport(1600, 720);
		const screen = await render(TabsOverflow, {});
		const list = screen.getByRole("tablist").element() as HTMLElement;
		const root = list.closest(".ca-tabs") as HTMLElement;
		expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth);
		expect(list.getBoundingClientRect().width).toBeLessThan(
			root.getBoundingClientRect().width - 100
		);
	});

	it("scrolls the selected tab into view on mount and when it changes", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		const screen = await render(TabsOverflow, { value: "integrations" });
		const list = screen.getByRole("tablist").element() as HTMLElement;
		const inView = (name: string) => {
			const tab = screen.getByRole("tab", { name }).element() as HTMLElement;
			const t = tab.getBoundingClientRect();
			const l = list.getBoundingClientRect();
			return t.left >= l.left - 1 && t.right <= l.right + 1;
		};
		await expect.poll(() => inView("Integrations")).toBe(true);
		(screen.getByRole("tab", { name: "General" }).element() as HTMLElement).focus();
		await expect.poll(() => inView("General")).toBe(true);
	});

	it("fade masks the trailing edge only while there is more to scroll", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		const screen = await render(TabsOverflow, { fade: true });
		const list = screen.getByRole("tablist").element() as HTMLElement;
		await expect.poll(() => list.dataset.fade).toBe("end");
		list.scrollLeft = list.scrollWidth;
		await expect.poll(() => list.dataset.fade).toBe("start");
		expect(getComputedStyle(list).maskImage).toContain("linear-gradient");
	});
});

// #1076: arrowing through a faded strip left the focused tab clipped or under the 32px edge fade: the reveal
// kept a 4px gutter and scroll snapping pulled the strip back after it.
describe("TabsList keyboard reveal with fade", () => {
	const clear = (list: HTMLElement, tab: HTMLElement) => {
		const l = list.getBoundingClientRect();
		const t = tab.getBoundingClientRect();
		const max = list.scrollWidth - list.clientWidth;
		// An edge is faded (32px) only while the strip can still scroll toward it.
		const startOk = list.scrollLeft < 1 || t.left >= l.left + 32 - 1;
		const endOk = list.scrollLeft > max - 1 || t.right <= l.right - 32 + 1;
		return startOk && endOk;
	};

	it("keeps every focused tab out from under the fade, both ways", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		const screen = await render(TabsOverflow, { fade: true });
		const list = screen.getByRole("tablist").element() as HTMLElement;
		const tabs = [...list.querySelectorAll<HTMLElement>('[role="tab"]')];
		expect(list.scrollWidth).toBeGreaterThan(list.clientWidth);
		tabs[0].focus();
		for (const key of ["{ArrowRight}", "{ArrowLeft}"]) {
			for (let i = 1; i < tabs.length; i++) {
				await userEvent.keyboard(key);
				const focused = document.activeElement as HTMLElement;
				await expect.poll(() => clear(list, focused), { timeout: 2000 }).toBe(true);
			}
		}
		await userEvent.keyboard("{End}");
		await expect.poll(() => clear(list, tabs.at(-1) as HTMLElement)).toBe(true);
		await userEvent.keyboard("{Home}");
		await expect.poll(() => clear(list, tabs[0])).toBe(true);
	});
});

describe("TabsTrigger icon", () => {
	it("renders a fixed, aria-hidden icon box and keeps the label as the name", async () => {
		const screen = await render(TabsIcon, {});
		const tab = screen.getByRole("tab", { name: "Plain" });
		const box = tab.element().querySelector(".ca-tabs-trigger__icon") as HTMLElement;
		expect(box.getAttribute("aria-hidden")).toBe("true");
		const r = box.getBoundingClientRect();
		expect(r.width).toBe(r.height);
		expect(r.width).toBeGreaterThan(0);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("a plain icon follows the state color, a brand icon never does", async () => {
		const screen = await render(TabsIcon, {});
		const box = (name: string) =>
			screen
				.getByRole("tab", { name })
				.element()
				.querySelector(".ca-tabs-trigger__icon") as HTMLElement;
		const trigger = (name: string) => screen.getByRole("tab", { name }).element() as HTMLElement;
		// Plain icon: tinted like the trigger text (active state).
		expect(getComputedStyle(box("Plain")).color).toBe(getComputedStyle(trigger("Plain")).color);
		// Brand icon: the active/disabled trigger color does not reach it.
		(trigger("Brand") as HTMLElement).focus();
		await expect.poll(() => trigger("Brand").dataset.state).toBe("active");
		expect(getComputedStyle(box("Brand")).color).not.toBe(getComputedStyle(trigger("Brand")).color);
		expect(getComputedStyle(box("Off")).opacity).toBe("1");
		expect(getComputedStyle(box("Off")).color).not.toBe(getComputedStyle(trigger("Off")).color);
	});

	it("SchemeAsset shows the variant of the active scheme", async () => {
		const screen = await render(TabsIcon, {});
		const shown = (id: string) =>
			getComputedStyle(screen.getByTestId(id).element()).display !== "none" &&
			(screen.getByTestId(id).element() as SVGElement).getBoundingClientRect().width > 0;
		document.documentElement.classList.remove("dark");
		expect(shown("brand-light")).toBe(true);
		expect(shown("brand-dark")).toBe(false);
		document.documentElement.classList.add("dark");
		try {
			expect(shown("brand-light")).toBe(false);
			expect(shown("brand-dark")).toBe(true);
		} finally {
			document.documentElement.classList.remove("dark");
		}
	});

	it("a SchemeAsset logo fills the 14px box, sized or not", async () => {
		const screen = await render(TabsIcon, {});
		const size = (id: string) => {
			const r = (screen.getByTestId(id).element() as Element).getBoundingClientRect();
			return [r.width, r.height];
		};
		const slot = (
			screen
				.getByRole("tab", { name: "Brand" })
				.element()
				.querySelector(".ca-tabs-trigger__icon") as HTMLElement
		).getBoundingClientRect();
		expect(slot.width).toBeGreaterThan(0);
		// Both axes are driven by the box, not by the asset: no width/height attribute, no intrinsic size.
		expect(size("brand-light")).toEqual([slot.width, slot.width]);
		expect(size("img-light")).toEqual([slot.width, slot.width]);
		expect(size("sized-light")).toEqual([slot.width, slot.width]);
	});
});

describe("Tabs as view switchers (no TabsContent)", () => {
	it("names the tablist and forwards attributes to list and triggers", async () => {
		const screen = await render(TabsViews, {});
		await expect.element(screen.getByRole("tablist", { name: "View" })).toBeInTheDocument();
		await expect.element(screen.getByTestId("views")).toHaveAttribute("role", "tablist");
		await expect.element(screen.getByTestId("view-a")).toHaveAttribute("role", "tab");
		await expect.element(screen.getByTestId("view-b")).toHaveAttribute("role", "tab");
	});

	it("does not point aria-controls at panels that do not exist", async () => {
		const screen = await render(TabsViews, {});
		await expect.element(screen.getByTestId("view-a")).not.toHaveAttribute("aria-controls");
		await expect.element(screen.getByTestId("view-b")).not.toHaveAttribute("aria-controls");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("still links a trigger to its panel when TabsContent exists", async () => {
		const screen = await render(TabsViews, { withPanel: true });
		const panel = screen.getByRole("tabpanel").element();
		await expect.element(screen.getByTestId("view-a")).toHaveAttribute("aria-controls", panel.id);
		// B has no panel: no dangling reference.
		await expect.element(screen.getByTestId("view-b")).not.toHaveAttribute("aria-controls");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});

describe("Tabs variant line", () => {
	it("underlines the active tab instead of filling the pill", async () => {
		const screen = await render(TabsViews, { variant: "line" });
		const list = screen.getByTestId("views").element() as HTMLElement;
		const a = screen.getByTestId("view-a").element() as HTMLElement;
		const b = screen.getByTestId("view-b").element() as HTMLElement;
		expect(list.dataset.variant).toBe("line");
		expect(getComputedStyle(list).borderRadius).toBe("0px");
		expect(getComputedStyle(a).backgroundColor).toBe("rgba(0, 0, 0, 0)");
		expect(getComputedStyle(a, "::after").backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
		expect(getComputedStyle(b, "::after").backgroundColor).toBe("rgba(0, 0, 0, 0)");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("keeps the pill by default", async () => {
		const screen = await render(TabsViews, {});
		const a = screen.getByTestId("view-a").element() as HTMLElement;
		expect(getComputedStyle(a).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
	});

	it("fill stretches the list and its hairline across the container", async () => {
		await page.viewport(1200, 720);
		const screen = await render(TabsViews, { variant: "line", fill: true });
		const list = screen.getByTestId("views").element() as HTMLElement;
		const root = list.closest(".ca-tabs") as HTMLElement;
		expect(list.dataset.fill).toBe("");
		expect(list.getBoundingClientRect().width).toBe(root.getBoundingClientRect().width);
		expect(getComputedStyle(list).boxShadow).not.toBe("none");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("hugs its tabs without fill", async () => {
		await page.viewport(1200, 720);
		const screen = await render(TabsViews, { variant: "line" });
		const list = screen.getByTestId("views").element() as HTMLElement;
		const root = list.closest(".ca-tabs") as HTMLElement;
		expect(list.hasAttribute("data-fill")).toBe(false);
		expect(list.getBoundingClientRect().width).toBeLessThan(
			root.getBoundingClientRect().width - 100
		);
	});

	it("keeps roving focus and aria-selected with fill", async () => {
		const screen = await render(TabsViews, { variant: "line", fill: true });
		(screen.getByTestId("view-a").element() as HTMLElement).focus();
		await userEvent.keyboard("{ArrowRight}");
		await expect.element(screen.getByTestId("view-b")).toHaveFocus();
		await expect.element(screen.getByTestId("view-b")).toHaveAttribute("aria-selected", "true");
		await expect.element(screen.getByTestId("view-a")).toHaveAttribute("aria-selected", "false");
	});
});

describe("Tabs trigger tokens", () => {
	const TOKENS = {
		"--ca-tabs-trigger-height": "36px",
		"--ca-tabs-trigger-padding-x": "12px",
		"--ca-tabs-trigger-radius": "8px",
		"--ca-tabs-trigger-font-size": "13px",
		"--ca-tabs-trigger-line-height": "16.25px",
	};

	it("the five tokens size the trigger, with no selector on .ca-tabs-*", async () => {
		const screen = await render(TabsViews, { variant: "line" });
		const root = screen.getByTestId("views").element().closest(".ca-tabs") as HTMLElement;
		const a = screen.getByTestId("view-a").element() as HTMLElement;
		const before = getComputedStyle(a);
		expect(before.height).not.toBe("36px");
		for (const [k, v] of Object.entries(TOKENS)) root.style.setProperty(k, v);
		const after = getComputedStyle(a);
		expect(after.height).toBe("36px");
		expect(after.paddingLeft).toBe("12px");
		expect(after.paddingRight).toBe("12px");
		expect(after.borderTopLeftRadius).toBe("8px");
		expect(after.fontSize).toBe("13px");
		expect(after.lineHeight).toBe("16.25px");
	});

	it("without tokens the trigger keeps today's sizes", async () => {
		const screen = await render(TabsViews, {});
		const a = getComputedStyle(screen.getByTestId("view-a").element() as HTMLElement);
		const probe = document.createElement("div");
		probe.style.cssText =
			"position:absolute;height:var(--ca-control-height-sm);padding-inline:var(--ca-space-3-5);font-size:var(--ca-font-size-body2)";
		document.body.append(probe);
		const want = getComputedStyle(probe);
		expect(a.height).toBe(want.height);
		expect(a.paddingLeft).toBe(want.paddingLeft);
		expect(a.fontSize).toBe(want.fontSize);
		// No line-height token: the trigger inherits the unitless body line height (a ratio of its own
		// font size), as before the tokens.
		const ratio =
			parseFloat(getComputedStyle(document.body).lineHeight) /
			parseFloat(getComputedStyle(document.body).fontSize);
		expect(parseFloat(a.lineHeight) / parseFloat(a.fontSize)).toBeCloseTo(ratio, 1);
		probe.remove();
	});
});
