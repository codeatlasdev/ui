import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { touchTarget } from "../../../tests/touch-target";
import { auditLayout } from "./layout-audit.js";

// #929: the site's layout audit, shipped from @codeatlasdev/ui/testing.
const host = document.createElement("main");
afterEach(() => host.remove());
const mount = (html: string) => {
	host.innerHTML = html;
	document.body.append(host);
};

describe("auditLayout (#929)", () => {
	it("passes a clean page", async () => {
		await page.viewport(390, 844);
		mount(`<h1>Title</h1><p>Some text that wraps normally inside its box.</p>`);
		expect(auditLayout({ mobile: true })).toEqual([]);
	});

	it("reports sideways scroll, clipped text and overlap", async () => {
		await page.viewport(390, 844);
		mount(
			`<div style="width:900px">wide</div>` +
				`<p style="width:60px;overflow:hidden;white-space:nowrap">a very long clipped line</p>` +
				`<p style="position:relative">First</p><p style="position:relative;margin-top:-1.2em">Second</p>`
		);
		const out = auditLayout();
		expect(out.some((m) => m.startsWith("page scrolls sideways by"))).toBe(true);
		expect(out.some((m) => m.startsWith("clipped p«a very long clipped line»"))).toBe(true);
		expect(out.some((m) => m.startsWith("overlap p«First» × p«Second»"))).toBe(true);
	});

	it("an ellipsis is not a clip", async () => {
		mount(
			`<p style="width:60px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">a very long line</p>`
		);
		expect(auditLayout()).toEqual([]);
	});

	it("with mobile, reports a control under --ca-touch-target", async () => {
		await page.viewport(390, 844);
		mount(`<button type="button" style="width:20px;height:20px;padding:0">x</button>`);
		expect(auditLayout()).toEqual([]);
		expect(auditLayout({ mobile: true })).toEqual([
			`touch target < ${touchTarget()}px: button. 20×20`,
		]);
	});

	it("runs from its own source, as Playwright's page.evaluate ships it", async () => {
		await page.viewport(390, 844);
		mount(`<button type="button" style="width:20px;height:20px;padding:0">x</button>`);
		const shipped = new Function(`return (${auditLayout.toString()})`)() as typeof auditLayout;
		expect(shipped({ mobile: true })).toEqual(auditLayout({ mobile: true }));
	});
});
