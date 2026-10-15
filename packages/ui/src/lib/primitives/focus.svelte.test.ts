import { afterEach, describe, expect, it } from "vitest";
import { focusables, focusFirst, trapFocus } from "./focus.js";

afterEach(() => {
	document.body.innerHTML = "";
});

function setup() {
	document.body.innerHTML = `
		<button id="opener">open</button>
		<div id="trap">
			<button id="a">a</button>
			<button id="dis" disabled>x</button>
			<input id="b" />
			<button id="hidden" style="display:none">h</button>
			<button id="c">c</button>
		</div>`;
	const q = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
	return { opener: q("opener"), trap: q("trap"), a: q("a"), b: q("b"), c: q("c") };
}
const tab = (el: Element, shiftKey = false) =>
	el.dispatchEvent(
		new KeyboardEvent("keydown", { key: "Tab", shiftKey, bubbles: true, cancelable: true })
	);

describe("focus", () => {
	it("focusables skips disabled and hidden; focusFirst focuses the first", () => {
		const { trap, a } = setup();
		expect(focusables(trap).map((e) => e.id)).toEqual(["a", "b", "c"]);
		expect(focusFirst(trap)).toBe(a);
		expect(document.activeElement).toBe(a);
	});

	it("trapFocus focuses first, Tab/Shift+Tab cycle, cleanup restores focus", () => {
		const { opener, trap, a, c } = setup();
		opener.focus();
		const release = trapFocus(trap);
		expect(document.activeElement).toBe(a);

		c.focus();
		tab(c);
		expect(document.activeElement).toBe(a);
		tab(a, true);
		expect(document.activeElement).toBe(c);

		release();
		expect(document.activeElement).toBe(opener);
	});

	it("initial 'container' focuses the node; initial false leaves focus; restore:false does not restore", () => {
		const { opener, trap } = setup();
		opener.focus();
		const r1 = trapFocus(trap, { initial: "container", restore: false });
		expect(document.activeElement).toBe(trap);
		r1();
		expect(document.activeElement).toBe(trap);

		opener.focus();
		const r2 = trapFocus(trap, { initial: false });
		expect(document.activeElement).toBe(opener);
		r2();
	});

	it("pulls focus back in when it escapes", () => {
		const { opener, trap, a } = setup();
		const release = trapFocus(trap);
		opener.focus();
		expect(document.activeElement).toBe(a);
		release();
	});
});

describe("nested traps (#138)", () => {
	it("only the newest trap owns focus; the older one resumes after it closes", () => {
		document.body.innerHTML = `
			<div id="outer"><button id="o">o</button></div>
			<div id="inner"><button id="i">i</button></div>`;
		const outer = document.getElementById("outer") as HTMLElement;
		const inner = document.getElementById("inner") as HTMLElement;
		const releaseOuter = trapFocus(outer);
		const releaseInner = trapFocus(inner);
		expect(document.activeElement?.id).toBe("i");
		(document.getElementById("o") as HTMLElement).focus();
		expect(document.activeElement?.id).toBe("i");
		releaseInner();
		expect(document.activeElement?.id).toBe("o");
		releaseOuter();
	});
});
