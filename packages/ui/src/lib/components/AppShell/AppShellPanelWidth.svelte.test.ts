import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import { VIEWPORTS } from "../../../../tests/viewports";
import Harness from "./AppShellHarness.test.svelte";
import { SHELL_KEY, shellScript } from "./shell-state";

const q = (sel: string) => document.querySelector(sel);
const main = () => q(".ca-main") as HTMLElement;
const panel = () => q(".ca-panel") as HTMLElement | null;
const html = document.documentElement;

/** Resolves once the shell offset is unchanged for `frames` frames in a row. */
async function settledOffset(frames = 30): Promise<void> {
	const read = () =>
		`${main().style.getPropertyValue("--ca-main-ml")}|${main().getBoundingClientRect().left}`;
	let last = read();
	let still = 0;
	while (still < frames) {
		await new Promise((r) => requestAnimationFrame(() => r(null)));
		const now = read();
		still = now === last ? still + 1 : 0;
		last = now;
	}
}

beforeEach(() => {
	localStorage.clear();
	sessionStorage.clear();
});
afterEach(() => {
	for (const a of ["data-ca-panel", "data-ca-module", "data-ca-hydrated", "data-ca-panel-width"])
		html.removeAttribute(a);
	html.style.removeProperty("--ca-panel-w-stored");
});

describe("panelWidth", () => {
	it("panel and content offset follow the prop", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(Harness, { pathname: "/app/dashboard", panelWidth: 320 });
		await settledOffset();
		expect(panel()?.getBoundingClientRect().width).toBe(320);
		expect(main().style.getPropertyValue("--ca-main-ml")).toBe("calc(52px + 320px)");
		expect(main().getBoundingClientRect().left).toBe(372);
	});

	it("moves the content when the prop changes", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, { pathname: "/app/dashboard", panelWidth: 240 });
		await settledOffset();
		expect(main().getBoundingClientRect().left).toBe(292);
		await screen.rerender({ pathname: "/app/dashboard", panelWidth: 300 });
		await settledOffset();
		expect(main().getBoundingClientRect().left).toBe(352);
		expect(panel()?.getBoundingClientRect().width).toBe(300);
	});

	it("clamps to the usable range", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, { pathname: "/app/dashboard", panelWidth: 20 });
		await settledOffset();
		expect(panel()?.getBoundingClientRect().width).toBe(160);
		await screen.rerender({ pathname: "/app/dashboard", panelWidth: 9000 });
		await settledOffset();
		expect(panel()?.getBoundingClientRect().width).toBe(480);
	});

	it("closing and reopening lands on the configured width", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, {
			pathname: "/app/dashboard",
			panelWidth: 280,
			full: true,
		});
		await screen.getByRole("button", { name: "Close navigation" }).click();
		await settledOffset();
		expect(main().getBoundingClientRect().left).toBe(52);
		await screen.getByRole("button", { name: "Open navigation" }).click();
		await settledOffset();
		expect(main().getBoundingClientRect().left).toBe(332);
	});
});

describe("resizablePanel", () => {
	const handle = () => page.getByRole("separator", { name: "Resize navigation panel" });

	it("has no handle unless resizablePanel is set", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(Harness, { pathname: "/app/dashboard" });
		await expect.poll(() => panel()).not.toBeNull();
		expect(q(".ca-panel__resize")).toBeNull();
	});

	it("is a focusable separator with value and bounds", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(Harness, { pathname: "/app/dashboard", resizablePanel: true });
		const el = handle();
		await expect.element(el).toHaveAttribute("aria-orientation", "vertical");
		await expect.element(el).toHaveAttribute("aria-valuenow", "200");
		await expect.element(el).toHaveAttribute("aria-valuemin", "160");
		await expect.element(el).toHaveAttribute("aria-valuemax", "480");
		await expect.element(el).toHaveAttribute("tabindex", "0");
	});

	it("resizes with arrows, Shift, Home and End", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(Harness, { pathname: "/app/dashboard", resizablePanel: true });
		(handle().element() as HTMLElement).focus();
		await userEvent.keyboard("{ArrowRight}");
		await settledOffset();
		expect(panel()?.getBoundingClientRect().width).toBe(208);
		await userEvent.keyboard("{Shift>}{ArrowRight}{/Shift}");
		await settledOffset();
		expect(panel()?.getBoundingClientRect().width).toBe(240);
		await userEvent.keyboard("{ArrowLeft}");
		await settledOffset();
		expect(panel()?.getBoundingClientRect().width).toBe(232);
		await userEvent.keyboard("{End}");
		await settledOffset();
		expect(panel()?.getBoundingClientRect().width).toBe(480);
		expect(main().getBoundingClientRect().left).toBe(532);
		await userEvent.keyboard("{Home}");
		await settledOffset();
		expect(panel()?.getBoundingClientRect().width).toBe(160);
		await expect.element(handle()).toHaveAttribute("aria-valuenow", "160");
	});

	it("drags with the content following, no spring lag", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(Harness, { pathname: "/app/dashboard", resizablePanel: true });
		await settledOffset();
		const box = (handle().element() as HTMLElement).getBoundingClientRect();
		const y = box.top + box.height / 2;
		const x = box.left + box.width / 2;
		const el = handle().element() as HTMLElement;
		el.dispatchEvent(
			new PointerEvent("pointerdown", {
				clientX: x,
				clientY: y,
				pointerId: 1,
				button: 0,
				bubbles: true,
			})
		);
		el.dispatchEvent(
			new PointerEvent("pointermove", { clientX: x + 100, clientY: y, pointerId: 1, bubbles: true })
		);
		// One frame later the panel and the content are already at the pointer: a drag never chases a spring.
		await new Promise((r) => requestAnimationFrame(() => r(null)));
		expect(panel()?.getBoundingClientRect().width).toBe(300);
		expect(main().getBoundingClientRect().left).toBe(352);
		el.dispatchEvent(
			new PointerEvent("pointerup", { clientX: x + 100, clientY: y, pointerId: 1, bubbles: true })
		);
		await settledOffset();
		expect(panel()?.getBoundingClientRect().width).toBe(300);
	});

	it("keeps a drag within the bounds", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(Harness, { pathname: "/app/dashboard", resizablePanel: true });
		const el = handle().element() as HTMLElement;
		const box = el.getBoundingClientRect();
		const y = box.top + 10;
		el.dispatchEvent(
			new PointerEvent("pointerdown", {
				clientX: box.left,
				clientY: y,
				pointerId: 1,
				button: 0,
				bubbles: true,
			})
		);
		el.dispatchEvent(
			new PointerEvent("pointermove", {
				clientX: box.left + 2000,
				clientY: y,
				pointerId: 1,
				bubbles: true,
			})
		);
		await new Promise((r) => requestAnimationFrame(() => r(null)));
		expect(panel()?.getBoundingClientRect().width).toBe(480);
		el.dispatchEvent(
			new PointerEvent("pointermove", { clientX: -500, clientY: y, pointerId: 1, bubbles: true })
		);
		await new Promise((r) => requestAnimationFrame(() => r(null)));
		expect(panel()?.getBoundingClientRect().width).toBe(160);
		el.dispatchEvent(
			new PointerEvent("pointerup", { clientX: 0, clientY: y, pointerId: 1, bubbles: true })
		);
	});

	it("has no axe violations", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, {
			pathname: "/app/dashboard",
			resizablePanel: true,
			full: true,
		});
		await expect.poll(() => panel()).not.toBeNull();
		await settled();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});

describe("panel width storage", () => {
	it("restores a resized width after a reload", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const first = await render(Harness, { persist: true, resizablePanel: true });
		(
			page.getByRole("separator", { name: "Resize navigation panel" }).element() as HTMLElement
		).focus();
		await userEvent.keyboard("{Shift>}{ArrowRight}{ArrowRight}{/Shift}");
		await settledOffset();
		expect(JSON.parse(localStorage.getItem(SHELL_KEY) ?? "{}").panelWidth).toBe(264);
		first.unmount();

		await render(Harness, { persist: true, resizablePanel: true });
		await settledOffset();
		expect(panel()?.getBoundingClientRect().width).toBe(264);
		expect(main().getBoundingClientRect().left).toBe(316);
	});

	it("persistPanel={false} ignores a stored width", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		localStorage.setItem(SHELL_KEY, JSON.stringify({ panelWidth: 400 }));
		await render(Harness, { persist: false, resizablePanel: true });
		await settledOffset();
		expect(panel()?.getBoundingClientRect().width).toBe(200);
		(
			page.getByRole("separator", { name: "Resize navigation panel" }).element() as HTMLElement
		).focus();
		await userEvent.keyboard("{ArrowRight}");
		expect(JSON.parse(localStorage.getItem(SHELL_KEY) ?? "{}").panelWidth).toBe(400);
	});

	it("ignores a stored width when not resizable", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		localStorage.setItem(SHELL_KEY, JSON.stringify({ panelWidth: 400 }));
		await render(Harness, { persist: true, panelWidth: 240 });
		await settledOffset();
		expect(panel()?.getBoundingClientRect().width).toBe(240);
	});

	it("drops a malformed stored width", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		localStorage.setItem(SHELL_KEY, JSON.stringify({ panelWidth: "wide" }));
		await render(Harness, { persist: true, resizablePanel: true });
		await settledOffset();
		expect(panel()?.getBoundingClientRect().width).toBe(200);
	});

	it("inline script paints the stored width", async () => {
		localStorage.setItem(SHELL_KEY, JSON.stringify({ panelWidth: 320 }));
		const host = document.createElement("div");
		host.innerHTML = `<aside><nav class="ca-panel__nav"></nav></aside>`;
		document.body.append(host);
		const script = document.createElement("script");
		script.textContent = shellScript(["app"], true).slice("<script>".length, -"</script>".length);
		host.querySelector("aside")?.after(script);
		expect(html.style.getPropertyValue("--ca-panel-w-stored")).toBe("320px");
		host.remove();
	});

	it("inline script skips it for a fixed panel", async () => {
		localStorage.setItem(SHELL_KEY, JSON.stringify({ panelWidth: 320 }));
		const host = document.createElement("div");
		host.innerHTML = `<aside><nav class="ca-panel__nav"></nav></aside>`;
		document.body.append(host);
		const script = document.createElement("script");
		script.textContent = shellScript(["app"], false).slice("<script>".length, -"</script>".length);
		host.querySelector("aside")?.after(script);
		expect(html.style.getPropertyValue("--ca-panel-w-stored")).toBe("");
		host.remove();
	});
});
