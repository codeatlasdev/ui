import { afterEach, describe, expect, it } from "vitest";

/**
 * #832: the reset's `* { margin: 0 }` removed the UA `margin: auto` of `[popover]` and `<dialog>`,
 * so a native one opened at the top-left corner instead of centred. The reset layer now restores
 * `margin: auto` for both; component rules live in the later `ca.components` layer and still win.
 */
const host = document.createElement("div");
afterEach(() => host.remove());

const centred = (el: HTMLElement) => {
	const r = el.getBoundingClientRect();
	const vw = document.documentElement.clientWidth;
	const vh = document.documentElement.clientHeight;
	return { dx: r.left + r.width / 2 - vw / 2, dy: r.top + r.height / 2 - vh / 2 };
};

describe("native top-layer elements stay centred under the reset", () => {
	it("[popover] opened with showPopover() is centred in the viewport", () => {
		host.innerHTML = `<div popover="manual" style="width:200px;height:100px">p</div>`;
		document.body.append(host);
		const el = host.firstElementChild as HTMLElement;
		el.showPopover();
		const { dx, dy } = centred(el);
		expect(Math.abs(dx)).toBeLessThan(1);
		expect(Math.abs(dy)).toBeLessThan(1);
		expect(getComputedStyle(el).margin).not.toBe("0px");
	});

	it("<dialog> opened with showModal() is centred in the viewport", () => {
		host.innerHTML = `<dialog style="width:200px;height:100px">d</dialog>`;
		document.body.append(host);
		const el = host.firstElementChild as HTMLDialogElement;
		el.showModal();
		const { dx, dy } = centred(el);
		expect(Math.abs(dx)).toBeLessThan(1);
		expect(Math.abs(dy)).toBeLessThan(1);
	});
});
