import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { nativeFeel } from "../src/lib/kit/native-feel.js";

beforeAll(() => GlobalRegistrator.register());
afterAll(() => GlobalRegistrator.unregister());

/** Fire a contextmenu on `el` and report whether the app kept the browser menu. */
const keepsMenu = (el: Element) => {
	const e = new window.MouseEvent("contextmenu", { bubbles: true, cancelable: true });
	el.dispatchEvent(e);
	return !e.defaultPrevented;
};

describe("nativeFeel opt-out class", () => {
	it("keeps the context menu on .ca-selectable, blocks it on chrome", () => {
		document.body.innerHTML = `
			<header>
				<div class="ca-selectable"><span id="in-selectable">text</span></div>
				<span id="chrome">title</span>
				<input id="field" />
			</header>`;
		const stop = nativeFeel();
		try {
			expect(keepsMenu(document.getElementById("in-selectable") as Element)).toBe(true);
			expect(keepsMenu(document.getElementById("field") as Element)).toBe(true);
			expect(keepsMenu(document.getElementById("chrome") as Element)).toBe(false);
		} finally {
			stop();
		}
	});

	it("is the same class the selection CSS opts back in", () => {
		const css = readFileSync(new URL("../src/lib/styles/base.css", import.meta.url), "utf8");
		const js = readFileSync(new URL("../src/lib/kit/native-feel.ts", import.meta.url), "utf8");
		expect(css).toContain("html[data-ca-native] .ca-selectable");
		expect(js).not.toMatch(/(?<!ca-)\.selectable\b/);
	});
});
