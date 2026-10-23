import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { VIEWPORTS } from "../../../../tests/viewports";
import ButtonHint from "./ButtonHint.test.svelte";

const width = (el: Element) => el.getBoundingClientRect().width;

describe("Button trailingHint", () => {
	it("shows the hint on a wide viewport", async () => {
		await page.viewport(1280, 720);
		const screen = await render(ButtonHint, { trailingHint: true });
		const hint = screen.container.querySelector(".ca-btn__trailing") as HTMLElement;
		expect(getComputedStyle(hint).display).not.toBe("none");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("below md the hint takes no space: width equals the label-only button", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		const withHint = await render(ButtonHint, { trailingHint: true });
		const labelOnly = await render(ButtonHint, { withTrailing: false });
		const a = withHint.container.querySelector(".ca-btn") as HTMLElement;
		const b = labelOnly.container.querySelector(".ca-btn") as HTMLElement;
		expect(getComputedStyle(a.querySelector(".ca-btn__trailing")!).display).toBe("none");
		expect(width(a)).toBe(width(b));
		expect(await checkA11y(withHint.container)).toHaveNoViolations();
	});

	it("a plain trailing slot keeps its gap on mobile (opt-in only)", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		const plain = await render(ButtonHint, { trailingHint: false });
		const labelOnly = await render(ButtonHint, { withTrailing: false });
		const a = plain.container.querySelector(".ca-btn") as HTMLElement;
		const b = labelOnly.container.querySelector(".ca-btn") as HTMLElement;
		expect(width(a)).toBeGreaterThan(width(b));
	});
});

describe("Button align", () => {
	it("between puts the label at the start and the trailing slot at the end", async () => {
		await page.viewport(1280, 720);
		const screen = await render(ButtonHint, { align: "between", fullWidth: true });
		const btn = screen.container.querySelector(".ca-btn") as HTMLElement;
		const trailing = btn.querySelector(".ca-btn__trailing") as HTMLElement;
		const box = btn.getBoundingClientRect();
		const pad = parseFloat(getComputedStyle(btn).paddingLeft);
		expect(box.right - trailing.getBoundingClientRect().right).toBeLessThanOrEqual(pad + 1);
		expect(getComputedStyle(btn).justifyContent).toBe("flex-start");
		const text = [...btn.childNodes].find((n) => n.textContent?.includes("Next lead")) as ChildNode;
		const range = document.createRange();
		range.selectNodeContents(text);
		expect(range.getBoundingClientRect().left - box.left).toBeLessThanOrEqual(pad + 1);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("between keeps the loading spinner in the leading position", async () => {
		await page.viewport(1280, 720);
		const idle = await render(ButtonHint, { align: "between", fullWidth: true });
		const busy = await render(ButtonHint, { align: "between", fullWidth: true, loading: true });
		const btn = busy.container.querySelector(".ca-btn") as HTMLElement;
		const spinner = btn.querySelector(".ca-btn__leading") as HTMLElement;
		expect(spinner).not.toBeNull();
		const pad = parseFloat(getComputedStyle(btn).paddingLeft);
		expect(
			spinner.getBoundingClientRect().left - btn.getBoundingClientRect().left
		).toBeLessThanOrEqual(pad + 1);
		expect(width(btn)).toBe(width(idle.container.querySelector(".ca-btn") as HTMLElement));
		expect(await checkA11y(busy.container)).toHaveNoViolations();
	});

	it("center (default) is unchanged", async () => {
		await page.viewport(1280, 720);
		const screen = await render(ButtonHint, { fullWidth: true });
		const btn = screen.container.querySelector(".ca-btn") as HTMLElement;
		expect(getComputedStyle(btn).justifyContent).toBe("center");
	});
});
