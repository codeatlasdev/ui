import { afterEach, describe, expect, it } from "vitest";
import { A11Y_EXCEPTIONS, checkA11y, expectNoA11yViolations, formatViolations } from "./index";

const mounted: HTMLElement[] = [];
function mount(html: string): HTMLElement {
	const el = document.createElement("div");
	el.innerHTML = html;
	document.body.append(el);
	mounted.push(el);
	return el;
}
afterEach(() => {
	for (const el of mounted.splice(0)) el.remove();
});

describe("@codeatlasdev/ui/testing", () => {
	it("passes a clean fragment without a page landmark (the `region` exception)", async () => {
		const el = mount('<button type="button">Save</button>');
		await expectNoA11yViolations(el);
	});

	it("reports a real violation with the rule id, help url and offending node", async () => {
		const el = mount('<button type="button"></button>');
		const error = await expectNoA11yViolations(el).then(
			() => null,
			(e: unknown) => e as Error
		);
		expect(error).toBeInstanceOf(Error);
		expect(error?.message).toContain("button-name");
		expect(error?.message).toContain("dequeuniversity.com");
		expect(error?.message).toContain("button");
	});

	it("checkA11y returns the axe results so callers can assert on them", async () => {
		const el = mount('<img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=">');
		const results = await checkA11y(el);
		expect(results.violations.map((v) => v.id)).toContain("image-alt");
		expect(formatViolations(results.violations)).toContain("image-alt");
	});

	it("accepts a Document as the target", async () => {
		mount('<main><h1>Title</h1><button type="button">Save</button></main>');
		await expectNoA11yViolations(document);
	});

	it("ships `region` disabled and lets the caller re-enable it", async () => {
		expect(A11Y_EXCEPTIONS.region).toEqual({ enabled: false });
		mount("<p>Loose text, no landmark</p>");
		const off = await checkA11y(document);
		expect(off.violations.map((v) => v.id)).not.toContain("region");
		const on = await checkA11y(document, { rules: { region: { enabled: true } } });
		expect(on.violations.map((v) => v.id)).toContain("region");
	});
});
