import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import Harness from "./LiveList.test.svelte";

const scroller = (c: Element) => c.querySelector(".ca-live-list__scroller") as HTMLElement;
const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)));
const announcer = () => document.querySelector('[data-ca-announcer="polite"]')?.textContent ?? "";
async function waitFor(fn: () => boolean, ms = 2000) {
	const end = Date.now() + ms;
	while (!fn()) {
		if (Date.now() > end) throw new Error("waitFor timed out");
		await new Promise((r) => setTimeout(r, 25));
	}
}

describe("LiveList", () => {
	it("renders rows through the item snippet inside a named log region", async () => {
		const screen = await render(Harness, { props: { initial: 3 } });
		const log = screen.getByRole("log", { name: "Checks" });
		await expect.element(log).toBeVisible();
		await expect.element(screen.getByText("Row 3")).toBeVisible();
		expect(screen.container.querySelectorAll("li").length).toBe(3);
	});

	it("does not make every appended row a live announcement", async () => {
		const screen = await render(Harness, { props: { initial: 1 } });
		const log = screen.container.querySelector("[role=log]") as HTMLElement;
		// The rows live in a region the screen reader does not read row by row;
		// batched summaries go through the shared announcer instead.
		expect(log.getAttribute("aria-live")).toBe("off");
	});

	it("announces new rows as one polite batch, not one per row", async () => {
		const screen = await render(Harness, { props: { initial: 0 } });
		const comp = screen.component as unknown as { push: (n?: number) => void };
		comp.push(5);
		comp.push(5);
		await waitFor(() => /10/.test(announcer()));
		expect(announcer()).toMatch(/10 new/i);
	});

	it("shows determinate progress when total is known", async () => {
		const screen = await render(Harness, { props: { initial: 3, total: 12 } });
		const bar = screen.container.querySelector("[role=progressbar]") as HTMLElement;
		expect(bar.getAttribute("aria-valuenow")).toBe("3");
		expect(bar.getAttribute("aria-valuemax")).toBe("12");
		await expect.element(screen.getByText("3 of 12")).toBeVisible();
	});

	it("follows the tail while the user is at the bottom", async () => {
		const screen = await render(Harness, { props: { initial: 30 } });
		const el = scroller(screen.container);
		el.scrollTop = el.scrollHeight;
		await frame();
		(screen.component as unknown as { push: (n?: number) => void }).push(10);
		await waitFor(() => el.scrollHeight - el.scrollTop - el.clientHeight < 2);
	});

	it("pauses following once the user scrolls up and offers a jump button", async () => {
		const screen = await render(Harness, { props: { initial: 30 } });
		const el = scroller(screen.container);
		el.scrollTop = el.scrollHeight;
		await frame();
		el.scrollTop = 0;
		el.dispatchEvent(new Event("scroll"));
		await frame();
		(screen.component as unknown as { push: (n?: number) => void }).push(7);
		await frame();
		await frame();
		expect(el.scrollTop).toBe(0);
		const jump = screen.getByRole("button", { name: /7 new/i });
		await expect.element(jump).toBeVisible();
		await jump.click();
		await waitFor(() => el.scrollHeight - el.scrollTop - el.clientHeight < 2);
		expect(screen.getByRole("button", { name: /new/i }).elements().length).toBe(0);
	});

	it("never moves focus when rows arrive", async () => {
		const screen = await render(Harness, { props: { initial: 30 } });
		const outside = screen.getByRole("button", { name: "Outside" });
		(outside.element() as HTMLElement).focus();
		(screen.component as unknown as { push: (n?: number) => void }).push(5);
		await frame();
		await frame();
		expect(document.activeElement).toBe(outside.element());

		const row = screen.getByRole("button", { name: "Act 3" });
		(row.element() as HTMLElement).focus();
		(screen.component as unknown as { push: (n?: number) => void }).push(5);
		await frame();
		await frame();
		expect(document.activeElement).toBe(row.element());
	});

	it("announces completion when status turns done, failure assertively", async () => {
		const screen = await render(Harness, { props: { initial: 2, total: 2 } });
		const comp = screen.component as unknown as { finish: (s?: "done" | "error") => void };
		comp.finish("done");
		await waitFor(() => /complete/i.test(announcer()));
		comp.finish("error");
		await waitFor(() =>
			/error/i.test(document.querySelector('[data-ca-announcer="assertive"]')?.textContent ?? "")
		);
	});

	it("has no axe violations", async () => {
		const screen = await render(Harness, { props: { initial: 5, total: 10 } });
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});
