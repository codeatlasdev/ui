import { afterEach, describe, expect, it } from "vitest";

// The stylesheet contract behind defineTheme's design knobs: derived tokens recompute where
// a knob changes, and surface styles redraw the same material tiers.
afterEach(() => {
	document.body.innerHTML = "";
});

function mount(html: string) {
	document.body.insertAdjacentHTML("beforeend", html);
	return (id: string) => {
		const el = document.getElementById(id);
		if (!el) throw new Error(`#${id} missing`);
		return getComputedStyle(el);
	};
}

describe("derived tokens", () => {
	it("a [data-ca-tokens] island recomputes spacing and radius from its own knobs", () => {
		const style = mount(`
			<div id="base" style="padding: var(--ca-space-4); border-radius: var(--ca-radius-md)"></div>
			<div data-ca-tokens style="--ca-density: 0.75; --ca-radius-scale: 0">
				<div id="island" style="padding: var(--ca-space-4); border-radius: var(--ca-radius-md)"></div>
			</div>`);
		expect(style("base").paddingTop).toBe("16px");
		expect(style("base").borderTopLeftRadius).toBe("10px");
		expect(style("island").paddingTop).toBe("12px");
		expect(style("island").borderTopLeftRadius).toBe("0px");
	});

	it("without [data-ca-tokens] a knob alone does not leak into derived values", () => {
		const style = mount(`
			<div style="--ca-density: 2">
				<div id="x" style="padding: var(--ca-space-4)"></div>
			</div>`);
		expect(style("x").paddingTop).toBe("16px");
	});
});

describe("surface styles", () => {
	it("outlined draws the tier edge as a border-width stroke and drops the blur", () => {
		const style = mount(
			`<div data-style="outlined" style="--ca-border-width: 3px"><div id="s" class="glass-regular"></div></div>`
		);
		expect(style("s").boxShadow).toContain("3px");
		expect(style("s").backdropFilter).toBe("none");
	});

	it("neumorphic extrudes with a light and a dark shadow", () => {
		const style = mount(
			`<div data-style="neumorphic"><div id="s" class="glass-regular"></div></div>`
		);
		const shadow = style("s").boxShadow;
		expect(shadow).toContain("-6px -6px");
		expect(shadow).toContain(" 6px 6px");
	});

	it("glass (default) keeps the backdrop blur", () => {
		const style = mount(`<div id="s" class="glass-regular"></div>`);
		// Chromium follows the OS (Windows "Transparency effects" off → reduce), where the
		// materials.css fallback drops the blur on purpose.
		if (matchMedia("(prefers-reduced-transparency: reduce)").matches)
			expect(style("s").backdropFilter).toBe("none");
		else expect(style("s").backdropFilter).toContain("blur");
	});
});
