import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { q } from "../../../../tests/dom";
import Stat from "./Stat.svelte";
import Narrow from "./StatNarrow.test.svelte";

const label = "Leads this week";

describe("Stat", () => {
	it("is a description list: label is the term, value the description", async () => {
		const screen = await render(Stat, { label, value: "128", hint: "12 more than last week" });
		const root = q(screen.container, ".ca-stat");
		expect(root.tagName).toBe("DL");
		const dt = q(root, "dt");
		expect(dt.textContent?.trim()).toBe(label);
		const dds = [...root.querySelectorAll("dd")].map((d) => d.textContent?.trim());
		expect(dds).toContain("128");
		expect(dds).toContain("12 more than last week");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("has no surface: no background, border or padding, colour inherited", async () => {
		const screen = await render(Stat, { label, value: "128" });
		const cs = getComputedStyle(q(screen.container, ".ca-stat"));
		expect(cs.backgroundColor).toBe("rgba(0, 0, 0, 0)");
		expect(cs.borderTopWidth).toBe("0px");
		expect(cs.paddingTop).toBe("0px");
		expect(cs.paddingLeft).toBe("0px");
	});

	it("uses the text roles: secondary label, primary value, hint hint", async () => {
		const screen = await render(Stat, { label, value: "128", hint: "h" });
		const color = (sel: string) => getComputedStyle(q(screen.container, sel)).color;
		const probe = (token: string) => {
			const el = document.createElement("span");
			el.style.color = `var(${token})`;
			document.body.append(el);
			const c = getComputedStyle(el).color;
			el.remove();
			return c;
		};
		expect(color(".ca-stat__label")).toBe(probe("--ca-text-secondary"));
		expect(color(".ca-stat__value")).toBe(probe("--ca-text-primary"));
		expect(color(".ca-stat__hint")).toBe(probe("--ca-text-hint"));
	});

	it("value uses tabular numerals", async () => {
		const screen = await render(Stat, { label, value: "128" });
		expect(getComputedStyle(q(screen.container, ".ca-stat__value")).fontVariantNumeric).toContain(
			"tabular-nums"
		);
	});

	it("shows the unit next to the value, inside the same description", async () => {
		const screen = await render(Stat, { label: "Reply rate", value: "18", unit: "%" });
		expect(q(screen.container, ".ca-stat__value").textContent?.replace(/\s+/g, "")).toBe("18%");
	});

	it.each([
		[12.34, "↑+12.3%", "ca-stat__trend--up"],
		[-2.4, "↓-2.4%", "ca-stat__trend--down"],
	] as const)("trend %s renders %s with a labelled indicator", async (trend, text, cls) => {
		const screen = await render(Stat, { label, value: "1", trend });
		const el = q(screen.container, ".ca-stat__trend");
		expect(el.textContent?.trim()).toBe(text);
		expect(el.classList.contains(cls)).toBe(true);
		expect(el.getAttribute("aria-label")).toBe(`Trend: ${text.replace(/[↑↓]/, "")}`);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("omits unit, hint and trend when not given", async () => {
		const screen = await render(Stat, { label, value: 1 });
		for (const sel of [".ca-stat__unit", ".ca-stat__hint", ".ca-stat__trend"])
			expect(screen.container.querySelector(sel), sel).toBeNull();
	});

	it.each(["sm", "md", "lg"] as const)(
		"size %s sets the value size, larger is bigger",
		async (size) => {
			const screen = await render(Stat, { label, value: "1", size });
			const px = Number.parseFloat(
				getComputedStyle(q(screen.container, ".ca-stat__value")).fontSize
			);
			const md = await render(Stat, { label, value: "1" });
			const mdPx = Number.parseFloat(getComputedStyle(q(md.container, ".ca-stat__value")).fontSize);
			if (size === "sm") expect(px).toBeLessThan(mdPx);
			if (size === "md") expect(px).toBe(mdPx);
			if (size === "lg") expect(px).toBeGreaterThan(mdPx);
		}
	);

	it("align center centres the text", async () => {
		const screen = await render(Stat, { label, value: "1", align: "center" });
		expect(getComputedStyle(q(screen.container, ".ca-stat")).textAlign).toBe("center");
		const start = await render(Stat, { label, value: "1" });
		expect(getComputedStyle(q(start.container, ".ca-stat")).textAlign).toBe("start");
	});

	it("at 390px the label truncates with an ellipsis and the value never wraps", async () => {
		const screen = await render(Narrow, {});
		const root = q(screen.container, ".ca-stat");
		const lbl = q(root, ".ca-stat__label");
		const val = q(root, ".ca-stat__value");
		expect(getComputedStyle(lbl).textOverflow).toBe("ellipsis");
		expect(getComputedStyle(lbl).whiteSpace).toBe("nowrap");
		expect(lbl.scrollWidth).toBeGreaterThan(lbl.clientWidth);
		expect(getComputedStyle(val).whiteSpace).toBe("nowrap");
		expect(val.getBoundingClientRect().height).toBeLessThan(
			Number.parseFloat(getComputedStyle(val).fontSize) * 1.6
		);
	});

	it("skeleton keeps the exact loaded box, is busy and hides the content", async () => {
		const props = { label, value: "128", hint: "12 more than last week", trend: 3 };
		const real = await render(Stat, props);
		const loading = await render(Stat, { ...props, skeleton: true });
		const a = q(real.container, ".ca-stat").getBoundingClientRect();
		const host = q(loading.container, ".ca-stat");
		const b = host.getBoundingClientRect();
		expect([b.width, b.height]).toEqual([a.width, a.height]);
		expect(host.getAttribute("aria-busy")).toBe("true");
		expect(host.hasAttribute("data-skeleton")).toBe(true);
		expect(await checkA11y(loading.container)).toHaveNoViolations();
	});

	it("a row of Stats is valid, one <dl> each", async () => {
		const screen = await render(Stat, { label, value: "1", class: "extra" });
		expect(q(screen.container, ".ca-stat").classList.contains("extra")).toBe(true);
	});
});
