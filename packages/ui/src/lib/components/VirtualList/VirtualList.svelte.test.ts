import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import Harness from "./VirtualList.test.svelte";

const scroller = (c: Element) => c.querySelector("[role=region]") as HTMLElement;
const lis = (c: Element) => Array.from(c.querySelectorAll("li"));
const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)));
const settle = async () => {
	for (let i = 0; i < 4; i++) await frame();
};
const rowOf = (c: Element, key: number) =>
	c.querySelector(`[data-key="${key}"]`) as HTMLElement | null;
const keys = (c: Element) =>
	lis(c).map((li) => Number((li.querySelector("[data-key]") as HTMLElement).dataset.key));
async function waitFor(fn: () => boolean, ms = 3000) {
	const end = Date.now() + ms;
	while (!fn()) {
		if (Date.now() > end) throw new Error("waitFor timed out");
		await new Promise((r) => setTimeout(r, 20));
	}
}
const top = (el: HTMLElement) => el.getBoundingClientRect().top;

describe("VirtualList", () => {
	it("renders a named, focusable region with a list inside", async () => {
		const screen = await render(Harness, { props: { initial: 5 } });
		const region = screen.getByRole("region", { name: "Messages" });
		await expect.element(region).toBeVisible();
		expect(scroller(screen.container).getAttribute("tabindex")).toBe("0");
		expect(screen.container.querySelectorAll("ul").length).toBe(1);
		expect(lis(screen.container).length).toBe(5);
	});

	it("keeps only a window of rows in the DOM for 1000 items", async () => {
		const screen = await render(Harness, { props: { initial: 1000 } });
		await settle();
		const n = lis(screen.container).length;
		expect(n).toBeGreaterThan(0);
		expect(n).toBeLessThan(60);
	});

	it("starts at the bottom and renders other rows when scrolling", async () => {
		const screen = await render(Harness, { props: { initial: 1000 } });
		await settle();
		const el = scroller(screen.container);
		expect(el.scrollHeight - el.scrollTop - el.clientHeight).toBeLessThan(2);
		expect(rowOf(screen.container, 1000)).not.toBeNull();
		expect(rowOf(screen.container, 500)).toBeNull();
		el.scrollTop = el.scrollHeight / 2;
		await waitFor(
			() =>
				rowOf(screen.container, 500) !== null ||
				keys(screen.container).some((k) => k > 400 && k < 600)
		);
		expect(rowOf(screen.container, 1000)).toBeNull();
		expect(lis(screen.container).length).toBeLessThan(60);
	});

	it("sets aria-setsize and aria-posinset on every row", async () => {
		const screen = await render(Harness, { props: { initial: 200 } });
		await settle();
		for (const li of lis(screen.container)) {
			expect(li.getAttribute("aria-setsize")).toBe("200");
			const key = Number((li.querySelector("[data-key]") as HTMLElement).dataset.key);
			expect(li.getAttribute("aria-posinset")).toBe(String(key));
		}
	});

	it("keeps the first visible row at the same y when older rows are prepended", async () => {
		const screen = await render(Harness, { props: { initial: 300 } });
		await settle();
		const el = scroller(screen.container);
		el.scrollTop = 4000;
		await settle();
		const box = el.getBoundingClientRect();
		const anchor = lis(screen.container)
			.map((li) => li.querySelector("[data-key]") as HTMLElement)
			.find((n) => n.getBoundingClientRect().top >= box.top + 1) as HTMLElement;
		const key = Number(anchor.dataset.key);
		const before = top(anchor);
		screen.component.prepend(20);
		await waitFor(() =>
			lis(screen.container).some((li) => li.getAttribute("aria-setsize") === "320")
		);
		await settle();
		const moved = rowOf(screen.container, key) as HTMLElement;
		expect(moved).not.toBeNull();
		expect(Math.abs(top(moved) - before)).toBeLessThanOrEqual(1);
	});

	it("keeps the anchor in place across several consecutive prepends", async () => {
		const screen = await render(Harness, { props: { initial: 300 } });
		await settle();
		const el = scroller(screen.container);
		el.scrollTop = 3000;
		await settle();
		const anchor = rowOf(screen.container, keys(screen.container)[8]) as HTMLElement;
		const key = Number(anchor.dataset.key);
		const before = top(anchor);
		for (const total of [310, 330, 335]) {
			screen.component.prepend(total === 310 ? 10 : total === 330 ? 20 : 5);
			await waitFor(() =>
				lis(screen.container).some((li) => li.getAttribute("aria-setsize") === String(total))
			);
			await settle();
			expect(
				Math.abs(top(rowOf(screen.container, key) as HTMLElement) - before)
			).toBeLessThanOrEqual(1);
		}
	});

	it("calls onloadmore once near the top, not again until items change", async () => {
		const onloadmore = vi.fn();
		const screen = await render(Harness, { props: { initial: 200, hasMore: true, onloadmore } });
		await settle();
		const el = scroller(screen.container);
		expect(onloadmore).not.toHaveBeenCalled();
		el.scrollTop = 0;
		await waitFor(() => onloadmore.mock.calls.length > 0);
		el.scrollTop = 2;
		await settle();
		expect(onloadmore).toHaveBeenCalledTimes(1);
	});

	it("asks for the next page once rows arrive and the user is still at the top", async () => {
		const onloadmore = vi.fn();
		const screen = await render(Harness, { props: { initial: 200, hasMore: true, onloadmore } });
		await settle();
		scroller(screen.container).scrollTop = 0;
		await waitFor(() => onloadmore.mock.calls.length === 1);
		screen.component.prepend(20);
		await waitFor(() =>
			lis(screen.container).some((li) => li.getAttribute("aria-setsize") === "220")
		);
		// The anchor keeps the user off the top after a prepend: scroll back to it for page two.
		scroller(screen.container).scrollTop = 0;
		await waitFor(() => onloadmore.mock.calls.length === 2);
	});

	it("does not call onloadmore while loadingMore or without hasMore", async () => {
		const loading = vi.fn();
		const a = await render(Harness, {
			props: { initial: 200, hasMore: true, loadingMore: true, onloadmore: loading },
		});
		await settle();
		scroller(a.container).scrollTop = 0;
		await settle();
		await new Promise((r) => setTimeout(r, 100));
		expect(loading).not.toHaveBeenCalled();

		const none = vi.fn();
		const b = await render(Harness, { props: { initial: 200, hasMore: false, onloadmore: none } });
		await settle();
		scroller(b.container).scrollTop = 0;
		await settle();
		await new Promise((r) => setTimeout(r, 100));
		expect(none).not.toHaveBeenCalled();
	});

	it("exposes a Load older button while hasMore that triggers onloadmore", async () => {
		const onloadmore = vi.fn();
		const screen = await render(Harness, { props: { initial: 50, hasMore: true, onloadmore } });
		await settle();
		scroller(screen.container).scrollTop = 600;
		await settle();
		const btn = screen.getByRole("button", { name: "Load older messages" });
		await btn.click();
		expect(onloadmore).toHaveBeenCalledTimes(1);

		const none = await render(Harness, { props: { initial: 5, hasMore: false } });
		expect(none.container.querySelector(".ca-virtual-list__older")).toBeNull();
	});

	it("shows a busy loading indicator instead of the button while loadingMore", async () => {
		const screen = await render(Harness, {
			props: { initial: 50, hasMore: true, loadingMore: true },
		});
		await settle();
		const busy = screen.container.querySelector("[aria-busy=true]") as HTMLElement;
		expect(busy.textContent).toContain("Loading older messages");
		expect(screen.container.querySelector("button.ca-virtual-list__older")).toBeNull();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("follows appended rows only while the user is at the bottom", async () => {
		const screen = await render(Harness, { props: { initial: 100 } });
		await settle();
		const el = scroller(screen.container);
		const gap = () => el.scrollHeight - el.scrollTop - el.clientHeight;
		expect(gap()).toBeLessThan(2);
		screen.component.append(5);
		await waitFor(() =>
			lis(screen.container).some((li) => li.getAttribute("aria-setsize") === "105")
		);
		await settle();
		expect(gap()).toBeLessThan(2);
		expect(rowOf(screen.container, 105)).not.toBeNull();

		el.scrollTop = 1000;
		await settle();
		const keep = el.scrollTop;
		screen.component.append(5);
		await waitFor(() =>
			lis(screen.container).some((li) => li.getAttribute("aria-setsize") === "110")
		);
		await settle();
		expect(Math.abs(el.scrollTop - keep)).toBeLessThanOrEqual(1);
		expect(gap()).toBeGreaterThan(100);
	});

	it("never follows when follow is false", async () => {
		const screen = await render(Harness, { props: { initial: 100, follow: false } });
		await settle();
		const el = scroller(screen.container);
		el.scrollTop = el.scrollHeight;
		await settle();
		const keep = el.scrollTop;
		screen.component.append(5);
		await waitFor(() =>
			lis(screen.container).some((li) => li.getAttribute("aria-setsize") === "105")
		);
		await settle();
		expect(Math.abs(el.scrollTop - keep)).toBeLessThanOrEqual(1);
	});

	it("announces appended rows once, politely, and prepends not at all", async () => {
		const announcer = () =>
			document.querySelector('[data-ca-announcer="polite"]')?.textContent ?? "";
		const screen = await render(Harness, { props: { initial: 20 } });
		await settle();
		screen.component.prepend(7);
		await new Promise((r) => setTimeout(r, 900));
		expect(announcer()).not.toContain("7 items");
		screen.component.append(2);
		screen.component.append(3);
		await waitFor(() => announcer().includes("5 items"));
	});

	it("has no axe violations: empty, populated, loading more", async () => {
		const empty = await render(Harness, { props: { initial: 0, withEmpty: true } });
		await expect.element(empty.getByText("Nothing yet")).toBeVisible();
		expect(await checkA11y(empty.container)).toHaveNoViolations();
		empty.unmount();

		const full = await render(Harness, { props: { initial: 100, hasMore: true } });
		await settle();
		expect(await checkA11y(full.container)).toHaveNoViolations();
		full.unmount();

		const loading = await render(Harness, {
			props: { initial: 100, hasMore: true, loadingMore: true },
		});
		await settle();
		expect(await checkA11y(loading.container)).toHaveNoViolations();
	});
});
