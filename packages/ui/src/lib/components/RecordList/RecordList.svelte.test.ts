import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { q } from "../../../../tests/dom";
import Harness from "./RecordListHarness.test.svelte";

/** True when the element is painted (not display:none, not visually hidden to a 1px box). */
const painted = (el: Element) => {
	const r = el.getBoundingClientRect();
	return getComputedStyle(el).display !== "none" && r.width > 1 && r.height > 1;
};

describe("RecordList (wide)", () => {
	it("is a labelled list with one item per record", async () => {
		const screen = await render(Harness, { width: 900 });
		await expect.element(screen.getByRole("list", { name: "Apps" })).toBeVisible();
		expect(screen.getByRole("listitem").elements()).toHaveLength(3);
	});

	it("header labels are hidden from AT and sit on the same columns as each row", async () => {
		const screen = await render(Harness, { width: 900 });
		const head = q(screen.container, ".ca-record-list__head");
		expect(head.getAttribute("aria-hidden")).toBe("true");
		const heads = [...head.querySelectorAll("[data-column]")];
		expect(heads.map((h) => h.textContent?.trim())).toEqual([
			"App",
			"Scopes",
			"Installs",
			"Created",
		]);

		const row = q(screen.container, ".ca-record-row");
		const identity = q(row, ".ca-record-row__identity");
		const cells = [...row.querySelectorAll(".ca-record-cell")];
		// header column n starts where row column n starts: one template drives both.
		expect(Math.round(heads[0].getBoundingClientRect().left)).toBe(
			Math.round(identity.getBoundingClientRect().left)
		);
		cells.forEach((cell, i) => {
			expect(Math.round(heads[i + 1].getBoundingClientRect().left)).toBe(
				Math.round(cell.getBoundingClientRect().left)
			);
		});
	});

	it("every row uses the same column x positions", async () => {
		const screen = await render(Harness, { width: 900, count: 3 });
		const lefts = [...screen.container.querySelectorAll(".ca-record-row")].map((row) =>
			[...row.querySelectorAll(".ca-record-cell")].map((c) =>
				Math.round(c.getBoundingClientRect().left)
			)
		);
		expect(lefts[1]).toEqual(lefts[0]);
		expect(lefts[2]).toEqual(lefts[0]);
	});

	it("per-cell labels stay in the DOM for AT but are not painted", async () => {
		const screen = await render(Harness, { width: 900 });
		const dt = q(screen.container, ".ca-record-cell dt");
		expect(dt.textContent).toBe("Scopes");
		expect(painted(dt)).toBe(false);
		expect(q(screen.container, ".ca-record-cell dd").textContent).toContain("read:users");
	});

	it("rows are separated by a line, the first one is not", async () => {
		const screen = await render(Harness, { width: 900 });
		const [first, second] = [...screen.container.querySelectorAll(".ca-record-row")];
		expect(getComputedStyle(first).borderTopWidth).toBe("0px");
		expect(getComputedStyle(second).borderTopWidth).not.toBe("0px");
	});

	it("the actions cell is at least 44px wide and tall", async () => {
		const screen = await render(Harness, { width: 900 });
		const box = q(screen.container, ".ca-record-row__actions").getBoundingClientRect();
		expect(box.width).toBeGreaterThanOrEqual(44);
		expect(box.height).toBeGreaterThanOrEqual(44);
	});

	it("has no axe violations", async () => {
		const screen = await render(Harness, { width: 900 });
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});

describe("RecordList (narrow container)", () => {
	// The breakpoint is the list's own width, not the viewport: the browser window stays wide.
	it("stacks into two lines: identity + actions, then labelled cells", async () => {
		const screen = await render(Harness, { width: 360 });
		const row = q(screen.container, ".ca-record-row");
		const identity = q(row, ".ca-record-row__identity").getBoundingClientRect();
		const actions = q(row, ".ca-record-row__actions").getBoundingClientRect();

		// same line: their vertical centres coincide (the 44px actions box is taller than the text)
		expect(
			Math.abs(identity.top + identity.height / 2 - (actions.top + actions.height / 2))
		).toBeLessThan(2);
		expect(actions.left).toBeGreaterThan(identity.right - 1);
		for (const cell of row.querySelectorAll(".ca-record-cell"))
			expect(cell.getBoundingClientRect().top).toBeGreaterThanOrEqual(identity.bottom - 1);
	});

	it("per-cell labels are painted and the column header is gone", async () => {
		const screen = await render(Harness, { width: 360 });
		const dts = [
			...screen.container.querySelectorAll(".ca-record-row:first-child .ca-record-cell dt"),
		];
		expect(dts.map((d) => d.textContent)).toEqual(["Scopes", "Installs", "Created"]);
		for (const dt of dts) expect(painted(dt)).toBe(true);
		expect(painted(q(screen.container, ".ca-record-list__head"))).toBe(false);
	});

	it("a stacked row stays compact (Table cards mode needs ~3x)", async () => {
		const screen = await render(Harness, { width: 360, count: 1 });
		const row = q(screen.container, ".ca-record-row").getBoundingClientRect();
		expect(row.height).toBeLessThan(180);
	});

	it("the actions cell stays a 44px target", async () => {
		const screen = await render(Harness, { width: 360 });
		const box = q(screen.container, ".ca-record-row__actions").getBoundingClientRect();
		expect(box.width).toBeGreaterThanOrEqual(44);
		expect(box.height).toBeGreaterThanOrEqual(44);
	});

	it("nothing overflows the container", async () => {
		const screen = await render(Harness, { width: 320 });
		const host = q(screen.container, '[data-testid="host"]');
		expect(host.scrollWidth).toBeLessThanOrEqual(host.clientWidth);
	});

	it("has no axe violations", async () => {
		const screen = await render(Harness, { width: 360 });
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});

describe("RecordList (empty and unlabelled)", () => {
	it("shows the empty snippet, no header and no list items", async () => {
		const screen = await render(Harness, { width: 900, none: true });
		await expect.element(screen.getByText("No apps yet")).toBeVisible();
		expect(screen.container.querySelector(".ca-record-list__head")).toBeNull();
		expect(screen.getByRole("listitem").elements()).toHaveLength(0);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("omits the header row when no labels are given", async () => {
		const screen = await render(Harness, { width: 900, header: false });
		expect(screen.container.querySelector(".ca-record-list__head")).toBeNull();
	});
});
