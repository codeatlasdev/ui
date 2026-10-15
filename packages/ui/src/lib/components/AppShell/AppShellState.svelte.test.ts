import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import { VIEWPORTS } from "../../../../tests/viewports";
import Harness from "./AppShellHarness.test.svelte";
import { restoreShell, SHELL_KEY, SHELL_SCROLL_KEY, shellScript } from "./shell-state";

const q = (sel: string) => document.querySelector(sel);
const html = document.documentElement;
const reports = () => page.getByRole("button", { name: "Reports" });

beforeEach(() => {
	localStorage.clear();
	sessionStorage.clear();
});
afterEach(() => {
	for (const a of ["data-ca-panel", "data-ca-module", "data-ca-hydrated"]) html.removeAttribute(a);
});

describe("AppShellLayout: persisted state", () => {
	it("keeps a collapsed section after the shell is mounted again (reload)", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const first = await render(Harness, { persist: true });
		await expect.element(reports()).toHaveAttribute("aria-expanded", "true");
		await reports().click();
		await expect.element(reports()).toHaveAttribute("aria-expanded", "false");
		first.unmount();

		await render(Harness, { persist: true });
		await expect.element(reports()).toHaveAttribute("aria-expanded", "false");
	});

	it("keeps the panel closed after a reload", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const first = await render(Harness, { persist: true, full: true });
		await first.getByRole("button", { name: "Close navigation" }).click();
		await expect.poll(() => q(".ca-panel")).toBeNull();
		first.unmount();

		await render(Harness, { persist: true, full: true });
		await expect.element(page.getByRole("button", { name: "Open navigation" })).toBeVisible();
		expect(q(".ca-panel")).toBeNull();
	});

	it("opens on the stored module when the URL matches none", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		localStorage.setItem(SHELL_KEY, JSON.stringify({ module: "cfg" }));
		await render(Harness, { persist: true, pathname: "/elsewhere" });
		await expect.element(q(".ca-panel__title") as HTMLElement).toHaveTextContent("Settings");
	});

	it("persistPanel={false} stores nothing and ignores stored state", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		localStorage.setItem(SHELL_KEY, JSON.stringify({ panel: false, sections: { Reports: false } }));
		await render(Harness, { persist: false });
		await expect.poll(() => q(".ca-panel")).not.toBeNull();
		await expect.element(reports()).toHaveAttribute("aria-expanded", "true");
		await reports().click();
		expect(JSON.parse(localStorage.getItem(SHELL_KEY) ?? "{}").sections).toEqual({
			Reports: false,
		});
	});

	it("ignores malformed stored values and removes them", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		localStorage.setItem(SHELL_KEY, '{"panel":"no","module":42,"sections":{"Reports":"x"}');
		await render(Harness, { persist: true });
		await expect.poll(() => q(".ca-panel")).not.toBeNull();
		await expect.element(reports()).toHaveAttribute("aria-expanded", "true");
		// The invalid blob is gone; what the shell stores afterwards is valid JSON.
		expect(JSON.parse(localStorage.getItem(SHELL_KEY) ?? "{}").sections).toEqual({});
	});

	it("migrates the legacy ca-panel-open key", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		localStorage.setItem("ca-panel-open", "false");
		await render(Harness, { persist: true });
		await settled();
		expect(q(".ca-panel")).toBeNull();
	});

	it("has no axe violations with a restored state", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		localStorage.setItem(SHELL_KEY, JSON.stringify({ sections: { Reports: false } }));
		const screen = await render(Harness, { persist: true });
		await expect.element(reports()).toHaveAttribute("aria-expanded", "false");
		await settled();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});

describe("shellScript: runs before hydration", () => {
	/** Parses the markup the server emits and executes the inline script in this document. */
	function runInline(ids: string[]) {
		const host = document.createElement("div");
		host.innerHTML = `<aside><nav class="ca-panel__nav"></nav></aside>`;
		document.body.append(host);
		const nav = host.querySelector(".ca-panel__nav") as HTMLElement;
		Object.defineProperty(nav, "scrollHeight", { value: 1000, configurable: true });
		nav.style.cssText = "height:100px;overflow:auto";
		nav.innerHTML = `<div style="height:1000px"></div>`;
		const tag = shellScript(ids);
		const body = tag.slice("<script>".length, -"</script>".length);
		// document.currentScript is the real <script> element when it is inserted into the page.
		const script = document.createElement("script");
		script.textContent = body;
		host.querySelector("aside")?.after(script);
		return { nav, host };
	}

	it("sets data-ca-panel, data-ca-module and the nav scroll", () => {
		localStorage.setItem(SHELL_KEY, JSON.stringify({ panel: false, module: "cfg" }));
		sessionStorage.setItem(SHELL_SCROLL_KEY, JSON.stringify({ cfg: 25 }));
		const { nav, host } = runInline(["app", "cfg"]);
		expect(html.getAttribute("data-ca-panel")).toBe("closed");
		expect(html.getAttribute("data-ca-module")).toBe("cfg");
		expect(nav.scrollTop).toBe(25);
		host.remove();
	});

	it("falls back to the default when storage is empty, invalid or names another shell's module", () => {
		localStorage.setItem(SHELL_KEY, JSON.stringify({ panel: "x", module: "other" }));
		sessionStorage.setItem(SHELL_SCROLL_KEY, JSON.stringify({ app: -5 }));
		const { nav, host } = runInline(["app", "cfg"]);
		expect(html.getAttribute("data-ca-panel")).toBe("open");
		expect(html.hasAttribute("data-ca-module")).toBe(false);
		expect(nav.scrollTop).toBe(0);
		host.remove();
	});

	it("is a self-contained function (no imports leak into the inline script)", () => {
		const src = restoreShell.toString();
		expect(src).not.toMatch(/\b(SHELL_KEY|readShellState|parseObject)\b/);
	});

	it("escapes </script> inside module ids", () => {
		expect(shellScript(["a</script><b"])).not.toContain("</script><b");
	});
});
