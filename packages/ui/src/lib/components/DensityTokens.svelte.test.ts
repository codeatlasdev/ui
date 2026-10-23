import { createRawSnippet } from "svelte";
import { afterEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../tests/a11y";
import Avatar from "./Avatar/Avatar.svelte";
import Card from "./Card/Card.svelte";
import EmptyState from "./EmptyState/EmptyState.svelte";
import TextArea from "./TextArea/TextArea.svelte";
import TextField from "./TextField/TextField.svelte";
import SegmentedControl from "./ToggleGroup/SegmentedControl.svelte";

/**
 * #376: density and appearance of Avatar, TextArea, TextField, Card, SegmentedControl and EmptyState
 * are component tokens (`--ca-<component>-<property>`), set from `:root`, a wrapper or the theme. Unset,
 * every component draws what it drew in 4.5.0.
 */
const root = document.documentElement;
afterEach(() => {
	root.removeAttribute("style");
	root.setAttribute("data-style", "solid");
});

const cs = (el: Element) => getComputedStyle(el);
const q = (c: HTMLElement, sel: string) => c.querySelector(sel) as HTMLElement;
const body = createRawSnippet(() => ({ render: () => `<p>Content</p>` }));
const items = [
	{ value: "a", label: "Day" },
	{ value: "b", label: "Week" },
];

describe("Avatar", () => {
	it("default fallback is the name-derived palette, semibold", async () => {
		const screen = await render(Avatar, { alt: "Ana Lima" });
		const f = q(screen.container, ".ca-avatar__fallback");
		expect(cs(f).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
		expect(cs(f).fontWeight).toBe("600");
	});

	it('tone="neutral" draws a neutral fallback from surface and secondary text, with a hairline ring', async () => {
		root.style.setProperty("--ca-surface-overlay", "rgb(240, 240, 240)");
		root.style.setProperty("--ca-text-secondary", "rgb(40, 40, 40)");
		const screen = await render(Avatar, { alt: "Ana Lima", tone: "neutral" });
		const f = q(screen.container, ".ca-avatar__fallback");
		expect(cs(f).backgroundColor).toBe("rgb(240, 240, 240)");
		expect(cs(f).color).toBe("rgb(40, 40, 40)");
		expect(cs(f).boxShadow).not.toBe("none");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it.each(["light", "dark"] as const)(
		'tone="neutral" is axe clean on the real tokens (%s)',
		async (scheme) => {
			root.classList.toggle("dark", scheme === "dark");
			const screen = await render(Avatar, { alt: "Ana Lima", tone: "neutral", size: "lg" });
			expect(await checkA11y(screen.container)).toHaveNoViolations();
			root.classList.remove("dark");
		}
	);

	it("--ca-avatar-fallback-* tokens win over the palette and the tone", async () => {
		root.style.setProperty("--ca-avatar-fallback-bg", "rgb(1, 2, 3)");
		root.style.setProperty("--ca-avatar-fallback-color", "rgb(4, 5, 6)");
		root.style.setProperty("--ca-avatar-fallback-size", "11px");
		root.style.setProperty("--ca-avatar-fallback-weight", "500");
		const screen = await render(Avatar, { alt: "Ana Lima" });
		const f = q(screen.container, ".ca-avatar__fallback");
		expect(cs(f).backgroundColor).toBe("rgb(1, 2, 3)");
		expect(cs(f).color).toBe("rgb(4, 5, 6)");
		expect(cs(f).fontSize).toBe("11px");
		expect(cs(f).fontWeight).toBe("500");
	});

	it("per-size fallback tokens only reach that size", async () => {
		root.style.setProperty("--ca-avatar-sm-fallback-size", "10px");
		const sm = await render(Avatar, { alt: "Ana Lima", size: "sm" });
		expect(cs(q(sm.container, ".ca-avatar__fallback")).fontSize).toBe("10px");
		const md = await render(Avatar, { alt: "Bia Souza", size: "md" });
		expect(cs(q(md.container, ".ca-avatar__fallback")).fontSize).not.toBe("10px");
	});
});

describe("TextField and TextArea", () => {
	it("defaults: gap space-1 (4px), label line-height snug", async () => {
		const tf = await render(TextField, { label: "Name" });
		expect(cs(q(tf.container, ".ca-tf")).rowGap).toBe("4px");
		const ta = await render(TextArea, { label: "Notes" });
		expect(cs(q(ta.container, ".ca-ta")).rowGap).toBe("4px");
	});

	it("--ca-field-gap and --ca-field-label-leading reach both, per-component tokens win", async () => {
		root.style.setProperty("--ca-field-gap", "8px");
		root.style.setProperty("--ca-field-label-leading", "1.2");
		const tf = await render(TextField, { label: "Name" });
		const ta = await render(TextArea, { label: "Notes" });
		expect(cs(q(tf.container, ".ca-tf")).rowGap).toBe("8px");
		expect(cs(q(ta.container, ".ca-ta")).rowGap).toBe("8px");
		const label = q(tf.container, ".ca-tf__label");
		expect(parseFloat(cs(label).lineHeight)).toBeCloseTo(parseFloat(cs(label).fontSize) * 1.2, 1);
		root.style.setProperty("--ca-tf-gap", "2px");
		expect(cs(q(tf.container, ".ca-tf")).rowGap).toBe("2px");
		expect(cs(q(ta.container, ".ca-ta")).rowGap).toBe("8px");
	});

	it("--ca-ta-min-height is the visible box height, border included", async () => {
		root.style.setProperty("--ca-ta-min-height", "64px");
		const screen = await render(TextArea, { label: "Notes", rows: 1 });
		const wrap = q(screen.container, ".ca-ta__wrap");
		expect(wrap.getBoundingClientRect().height).toBe(64);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("without the token the box keeps its rows-based height", async () => {
		const screen = await render(TextArea, { label: "Notes", rows: 4 });
		const input = q(screen.container, ".ca-ta__input");
		expect(cs(input).minHeight).toBe("112px");
	});
});

describe("Card", () => {
	it("--ca-card-bg/radius/border/shadow restyle one card, defaults untouched", async () => {
		const plain = await render(Card, { children: body });
		const before = cs(q(plain.container, ".ca-card"));
		const def = { radius: before.borderRadius, shadow: before.boxShadow };
		root.style.setProperty("--ca-card-bg", "rgb(9, 9, 9)");
		root.style.setProperty("--ca-card-radius", "7px");
		root.style.setProperty("--ca-card-border", "1px solid rgb(5, 6, 7)");
		root.style.setProperty("--ca-card-shadow", "none");
		const screen = await render(Card, { children: body });
		const s = cs(q(screen.container, ".ca-card"));
		expect(s.backgroundColor).toBe("rgb(9, 9, 9)");
		expect(s.borderRadius).toBe("7px");
		expect(s.borderTopColor).toBe("rgb(5, 6, 7)");
		expect(s.borderTopWidth).toBe("1px");
		expect(s.boxShadow).toBe("none");
		expect(def.radius).not.toBe("7px");
		expect(def.shadow).not.toBe("none");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("no tokens: no border is drawn", async () => {
		const screen = await render(Card, { children: body });
		expect(cs(q(screen.container, ".ca-card")).borderTopWidth).toBe("0px");
	});
});

describe("SegmentedControl", () => {
	it("--ca-seg-item-padding-x/font-size/line-height", async () => {
		const before = await render(SegmentedControl, { items, "aria-label": "View" });
		const pad = cs(q(before.container, ".ca-seg__item")).paddingInlineStart;
		root.style.setProperty("--ca-seg-item-padding-x", "6px");
		root.style.setProperty("--ca-seg-item-font-size", "13px");
		root.style.setProperty("--ca-seg-item-line-height", "1");
		const screen = await render(SegmentedControl, { items, "aria-label": "View" });
		const s = cs(q(screen.container, ".ca-seg__item"));
		expect(pad).toBe("16px");
		expect(s.paddingInlineStart).toBe("6px");
		expect(s.fontSize).toBe("13px");
		expect(s.lineHeight).toBe("13px");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("size sm keeps its own padding unless the token is set", async () => {
		const sm = await render(SegmentedControl, { items, size: "sm", "aria-label": "View" });
		expect(cs(q(sm.container, ".ca-seg__item")).paddingInlineStart).toBe("12px");
	});
});

describe("EmptyState", () => {
	it("bare removes the padding", async () => {
		const def = await render(EmptyState, { title: "Nothing" });
		expect(cs(q(def.container, ".ca-empty")).paddingTop).toBe("48px");
		const bare = await render(EmptyState, { title: "Nothing here", bare: true });
		expect(cs(q(bare.container, ".ca-empty")).paddingTop).toBe("0px");
		expect(await checkA11y(bare.container)).toHaveNoViolations();
	});

	it("--ca-empty-title-size and --ca-empty-title-weight", async () => {
		root.style.setProperty("--ca-empty-title-size", "15px");
		root.style.setProperty("--ca-empty-title-weight", "500");
		const screen = await render(EmptyState, { title: "Nothing" });
		const t = cs(q(screen.container, ".ca-empty__title"));
		expect(t.fontSize).toBe("15px");
		expect(t.fontWeight).toBe("500");
	});

	it("actionsFill stretches the actions to the full width", async () => {
		const actions = createRawSnippet(() => ({
			render: () => `<button type="button">Invite</button>`,
		}));
		const fill = await render(EmptyState, { title: "Nothing", actions, actionsFill: true });
		const a = q(fill.container, ".ca-empty__actions");
		expect(cs(a).flexDirection).toBe("column");
		expect(cs(q(a, "button")).width).toBe(`${a.getBoundingClientRect().width}px`);
		expect(await checkA11y(fill.container)).toHaveNoViolations();
	});
});
