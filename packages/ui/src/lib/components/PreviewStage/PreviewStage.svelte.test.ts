import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { q } from "../../../../tests/dom";
import Harness from "./PreviewStageHarness.test.svelte";

const frame = (c: HTMLElement) => q(c, ".ca-pstage__frame");
const handle = (c: HTMLElement) => q(c, '[role="separator"]');
const px = (c: HTMLElement) => Math.round(frame(c).getBoundingClientRect().width);

describe("PreviewStage width", () => {
	it("fills the stage by default and a preset sets an exact width", async () => {
		const screen = await render(Harness, {});
		expect(px(screen.container)).toBeGreaterThan(850);
		await screen.getByRole("radio", { name: "390" }).click();
		expect(px(screen.container)).toBe(390);
		expect(screen.getByTestId("w").element().textContent).toBe("390");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("the splitter resizes with arrows, Shift and Home/End within its limits", async () => {
		const screen = await render(Harness, { width: 768 });
		const h = handle(screen.container);
		h.focus();
		await userEvent.keyboard("{ArrowRight}");
		expect(px(screen.container)).toBe(778);
		await userEvent.keyboard("{Shift>}{ArrowLeft}{/Shift}");
		expect(px(screen.container)).toBe(678);
		await userEvent.keyboard("{Home}");
		expect(px(screen.container)).toBe(280);
		await userEvent.keyboard("{End}");
		// 1280 px of page scaled to the 900 px stage.
		expect(px(screen.container)).toBeLessThanOrEqual(901);
		expect(h.getAttribute("aria-valuenow")).toBe("1280");
	});

	it("a frame wider than the stage is scaled whole, not clipped", async () => {
		const screen = await render(Harness, { width: 1280 });
		const rect = frame(screen.container).getBoundingClientRect();
		expect(rect.width).toBeLessThanOrEqual(901);
		expect(handle(screen.container).getAttribute("aria-valuenow")).toBe("1280");
	});

	it("reports its readout", async () => {
		const screen = await render(Harness, { width: 390 });
		expect(q(screen.container, "output.ca-pstage__readout").textContent).toBe("390 px");
	});
});

describe("PreviewStage scrolling", () => {
	it("a demo taller than the stage scrolls by keyboard, and axe passes", async () => {
		const screen = await render(Harness, { tall: true });
		const f = frame(screen.container);
		expect(f.scrollHeight).toBeGreaterThan(f.clientHeight);
		expect(f.tabIndex).toBe(0);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});

describe("PreviewStage theming", () => {
	it("a scheme scopes the content to its own island", async () => {
		const screen = await render(Harness, { scheme: "dark", preset: "ocean" });
		const island = q(screen.container, ".ca-theme-island");
		expect(island.getAttribute("data-theme-scope")).toBe("dark");
		expect(island.getAttribute("data-preset")).toBe("ocean");
		expect(document.documentElement.getAttribute("data-theme-scope")).not.toBe("dark");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("the island is as tall as the stage and centres its content", async () => {
		const screen = await render(Harness, { scheme: "dark" });
		const frameRect = frame(screen.container).getBoundingClientRect();
		const probe = q(screen.container, ".probe").getBoundingClientRect();
		expect(
			Math.abs(probe.top + probe.height / 2 - (frameRect.top + frameRect.height / 2))
		).toBeLessThan(4);
	});

	it("inherit renders without an island", async () => {
		const screen = await render(Harness, {});
		expect(screen.container.querySelector(".ca-theme-island")).toBeNull();
	});
});

describe("PreviewStage iframe mode", () => {
	it("shows a same-origin page in a titled, isolated iframe at the chosen width", async () => {
		const screen = await render(Harness, { src: "about:blank", width: 390 });
		const f = q(screen.container, "iframe") as HTMLIFrameElement;
		expect(f.title).toBe("Page");
		expect(Math.round(f.getBoundingClientRect().width)).toBe(390);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});
