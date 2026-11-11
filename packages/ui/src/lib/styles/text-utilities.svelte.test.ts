import "./text.css";
import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";

// #724: .ca-truncate (one line, ellipsis, shrinks inside flex/grid) and .ca-clamp (N lines, --ca-clamp).
const host = document.createElement("div");
afterEach(() => host.remove());
const LONG =
	"A very long conversation title that does not fit in a narrow phone column at all ".repeat(3);

describe("text utilities (#724)", () => {
	it(".ca-truncate shrinks inside a flex row and adds an ellipsis, no page scroll at 360px", async () => {
		await page.viewport(360, 780);
		host.innerHTML = `<div style="display:flex;gap:8px"><span>Icon</span><span class="ca-truncate" data-t>${LONG}</span></div>`;
		document.body.append(host);
		const t = host.querySelector("[data-t]") as HTMLElement;
		const cs = getComputedStyle(t);
		expect(cs.textOverflow).toBe("ellipsis");
		expect(cs.whiteSpace).toBe("nowrap");
		expect(t.scrollWidth).toBeGreaterThan(t.clientWidth);
		expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	});

	it(".ca-clamp cuts at --ca-clamp lines and shows the whole text when it fits", async () => {
		host.innerHTML = `<p class="ca-clamp" style="--ca-clamp: 3; width: 200px; line-height: 20px" data-c>${LONG}</p><p class="ca-clamp" style="width: 200px; line-height: 20px" data-s>Short</p>`;
		document.body.append(host);
		const c = host.querySelector("[data-c]") as HTMLElement;
		expect(c.getBoundingClientRect().height).toBeCloseTo(60, 0);
		expect(c.scrollHeight).toBeGreaterThan(c.clientHeight);
		const s = host.querySelector("[data-s]") as HTMLElement;
		expect(s.scrollHeight).toBe(s.clientHeight);
	});

	it(".ca-clamp defaults to 2 lines", async () => {
		host.innerHTML = `<p class="ca-clamp" style="width: 200px; line-height: 20px" data-c>${LONG}</p>`;
		document.body.append(host);
		expect(
			(host.querySelector("[data-c]") as HTMLElement).getBoundingClientRect().height
		).toBeCloseTo(40, 0);
	});
});
