import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import Harness from "./InputGroupHarness.test.svelte";

// #765: a field and a button joined into one control: one seam, squared inner corners, equal height.
describe("InputGroup (#765)", () => {
	it("joins the field box and the button", async () => {
		const screen = await render(Harness);
		await expect.element(screen.getByRole("group", { name: "Invite" })).toBeVisible();
		const box = screen.container.querySelector(".ca-tf__wrap") as HTMLElement;
		const btn = screen.getByRole("button", { name: "Send invite" }).element() as HTMLElement;
		const b = box.getBoundingClientRect();
		const r = btn.getBoundingClientRect();
		const border = Number.parseFloat(getComputedStyle(box).borderRightWidth) || 1;
		expect(r.left).toBeCloseTo(b.right - border, 0);
		expect(r.height).toBeCloseTo(b.height, 0);
		expect(r.bottom).toBeCloseTo(b.bottom, 0);
		expect(getComputedStyle(box).borderTopRightRadius).toBe("0px");
		expect(getComputedStyle(btn).borderTopLeftRadius).toBe("0px");
		expect(Number.parseFloat(getComputedStyle(box).borderTopLeftRadius)).toBeGreaterThan(0);
		expect(Number.parseFloat(getComputedStyle(btn).borderTopRightRadius)).toBeGreaterThan(0);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});
