import { afterEach, describe, expect, it } from "vitest";

/**
 * #549: a clickable element that is not a kit component (a tile with `role="button"`, a
 * `<summary>`, a `<label for>`) showed the arrow cursor, because `cursor: pointer` was written per
 * component. The reset layer now gives every interactive shape a pointer and every disabled one
 * `not-allowed`; it lives in `@layer ca.reset`, so any app rule overrides it.
 */
const host = document.createElement("div");
const appCss = document.createElement("style");
afterEach(() => {
	host.remove();
	appCss.remove();
	delete document.documentElement.dataset.caNative;
});

const cursor = (html: string) => {
	host.innerHTML = html;
	document.body.append(host);
	return getComputedStyle(host.firstElementChild as Element).cursor;
};

describe("reset gives interactive elements a pointer cursor", () => {
	const interactive: Record<string, string> = {
		button: `<button type="button">b</button>`,
		"role=button": `<div role="button" tabindex="0">t</div>`,
		"role=tab": `<div role="tab">t</div>`,
		"role=option": `<div role="option">o</div>`,
		"role=menuitem": `<div role="menuitem">m</div>`,
		"role=menuitemcheckbox": `<div role="menuitemcheckbox">m</div>`,
		"role=menuitemradio": `<div role="menuitemradio">m</div>`,
		summary: `<details><summary>s</summary>x</details>`,
		"label[for]": `<label for="x">l</label><input id="x">`,
		"a[href]": `<a href="/x">a</a>`,
	};
	for (const [name, html] of Object.entries(interactive))
		it(name, () => {
			host.innerHTML = html;
			document.body.append(host);
			const target = host.querySelector("summary, label, a, button, [role]") as Element;
			expect(getComputedStyle(target).cursor).toBe("pointer");
		});

	it("a bare <a> without href and a plain <div> keep the default", () => {
		expect(cursor(`<a>a</a>`)).toBe("auto");
		expect(cursor(`<div>d</div>`)).toBe("auto");
	});
});

describe("the glass and rail classes rely on the reset (no own cursor rule)", () => {
	it("glass-btn*, ca-rail-btn on <button>, ca-rail-btn on <a href>", () => {
		for (const html of [
			`<button type="button" class="glass-btn">b</button>`,
			`<button type="button" class="glass-btn-prominent">b</button>`,
			`<button type="button" class="glass-btn-clear">b</button>`,
			`<button type="button" class="ca-rail-btn">b</button>`,
			`<a href="/x" class="ca-rail-btn">a</a>`,
		])
			expect(cursor(html), html).toBe("pointer");
	});
});

describe("reset marks disabled controls not-allowed", () => {
	it("disabled button, aria-disabled role=button, aria-disabled menuitem", () => {
		expect(cursor(`<button type="button" disabled>b</button>`)).toBe("not-allowed");
		expect(cursor(`<div role="button" aria-disabled="true">t</div>`)).toBe("not-allowed");
		expect(cursor(`<div role="menuitem" aria-disabled="true">m</div>`)).toBe("not-allowed");
	});
});

describe("apps override the reset freely", () => {
	it("an unlayered app rule beats it with no !important", () => {
		appCss.textContent = `[role="button"] { cursor: grab; }`;
		document.head.append(appCss);
		expect(cursor(`<div role="button" tabindex="0">t</div>`)).toBe("grab");
	});
});

describe("nativeFeel keeps the hand on clickable controls (#566)", () => {
	// `html[data-ca-native]` (nativeFeel()) lives in ca.base, which outranks ca.reset: it used to force
	// the arrow on every control, so an app shell (Atlas) never showed a pointer.
	it("button and role=tab keep the pointer under html[data-ca-native]", () => {
		document.documentElement.dataset.caNative = "";
		expect(cursor(`<button type="button">b</button>`)).toBe("pointer");
		expect(cursor(`<div role="tab">t</div>`)).toBe("pointer");
		expect(cursor(`<div role="menuitem">m</div>`)).toBe("pointer");
		expect(cursor(`<a href="/x">a</a>`)).toBe("pointer");
	});

	it("disabled controls stay not-allowed and chrome that is not clickable keeps the default", () => {
		document.documentElement.dataset.caNative = "";
		expect(cursor(`<button type="button" disabled>b</button>`)).toBe("not-allowed");
		expect(cursor(`<nav>n</nav>`)).toBe("auto");
		expect(cursor(`<header>h</header>`)).toBe("auto");
	});

	it("still blocks text selection on chrome", () => {
		document.documentElement.dataset.caNative = "";
		host.innerHTML = `<button type="button">b</button>`;
		document.body.append(host);
		expect(getComputedStyle(host.firstElementChild as Element).userSelect).toBe("none");
	});
});
