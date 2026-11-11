import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import Harness from "./TableSortHeader.test.svelte";

const icon = (c: Element) => c.querySelector(".ca-table-sort__icon");

describe("TableSortHeader idleIcon (#701)", () => {
	it("draws the idle arrow by default", async () => {
		const screen = await render(Harness, {});
		expect(icon(screen.container)).not.toBeNull();
	});

	it("idleIcon={false}: an unsorted column shows only its label", async () => {
		const screen = await render(Harness, { idleIcon: false });
		expect(icon(screen.container)).toBeNull();
		expect(screen.container.querySelector("th")?.hasAttribute("aria-sort")).toBe(false);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("idleIcon={false}: the sorted column keeps its arrow and aria-sort", async () => {
		const screen = await render(Harness, { idleIcon: false, sort: "desc" });
		expect(icon(screen.container)).not.toBeNull();
		expect(screen.container.querySelector("th")?.getAttribute("aria-sort")).toBe("descending");
	});
});
