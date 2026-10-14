import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";

/**
 * `.ca-sr-only` (utilities.css) is the one visually-hidden pattern: no visible box, still in the
 * accessibility tree. The focusable variant is for skip links and similar: hidden until focused.
 */
const host = document.createElement("div");
afterEach(() => host.remove());

function mount(html: string) {
	host.innerHTML = html;
	document.body.append(host);
}

describe(".ca-sr-only", () => {
	it("is visually hidden (1px box, clipped) but stays in the accessibility tree", () => {
		mount(
			`<p>before</p><table><caption class="ca-sr-only">Quarterly totals</caption><tbody><tr><td>1</td></tr></tbody></table>`
		);
		const caption = host.querySelector("caption") as HTMLElement;
		const cs = getComputedStyle(caption);
		const rect = caption.getBoundingClientRect();
		expect(cs.position).toBe("absolute");
		expect(cs.overflow).toBe("hidden");
		expect(cs.clipPath).not.toBe("none");
		expect(rect.width).toBeLessThanOrEqual(1);
		expect(rect.height).toBeLessThanOrEqual(1);
		// Not removed from the a11y tree: display/visibility untouched, text still there.
		expect(cs.display).not.toBe("none");
		expect(cs.visibility).toBe("visible");
		expect(host.querySelector("table")?.getAttribute("aria-hidden")).toBeNull();
		expect(caption.textContent).toBe("Quarterly totals");
	});

	it("does not stretch the layout of its container", () => {
		mount(
			`<div id="c" style="position:relative"><span class="ca-sr-only">hidden label that is long enough to overflow</span>x</div>`
		);
		const c = host.querySelector("#c") as HTMLElement;
		expect(c.scrollWidth).toBeLessThanOrEqual(c.clientWidth);
	});

	it(".ca-sr-only--focusable reveals on focus and hides again on blur", async () => {
		mount(
			`<a href="#main" class="ca-sr-only ca-sr-only--focusable">Skip to content</a><main id="main">x</main>`
		);
		const link = host.querySelector("a") as HTMLElement;
		expect(link.getBoundingClientRect().width).toBeLessThanOrEqual(1);
		await userEvent.tab();
		expect(document.activeElement).toBe(link);
		expect(link.getBoundingClientRect().width).toBeGreaterThan(20);
		expect(link.getBoundingClientRect().height).toBeGreaterThan(10);
		link.blur();
		expect(link.getBoundingClientRect().width).toBeLessThanOrEqual(1);
	});
});
