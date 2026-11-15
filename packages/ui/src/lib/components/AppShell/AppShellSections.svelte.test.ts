import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import { VIEWPORTS } from "../../../../tests/viewports";
import Harness from "./AppShellSections.test.svelte";

const html = document.documentElement;
// Section triggers and rail modules are both buttons named by their visible label.
const button = (name: string) => page.getByRole("button", { name, exact: true });
const title = () => document.querySelector(".ca-panel__title")?.textContent;
type Api = { go: (path: string) => void };

beforeEach(async () => {
	localStorage.clear();
	await page.viewport(...VIEWPORTS.desktop);
});
afterEach(() => {
	for (const a of ["data-ca-panel", "data-ca-module", "data-ca-hydrated"]) html.removeAttribute(a);
});

describe("AppShell sections: per module (#1173)", () => {
	it("same label in two modules: separate open state", async () => {
		await render(Harness, {});
		await button("Cadastros").click();
		await expect.element(button("Cadastros")).toHaveAttribute("aria-expanded", "false");

		await button("Finance").click();
		await expect.poll(title).toBe("Finance");
		await expect.element(button("Cadastros")).toHaveAttribute("aria-expanded", "true");

		// Back in CRM the choice made there is still in place.
		await button("CRM").click();
		await expect.poll(title).toBe("CRM");
		await expect.element(button("Cadastros")).toHaveAttribute("aria-expanded", "false");
	});

	it("stores the choice per module across a reload", async () => {
		const first = await render(Harness, { persist: true });
		await button("Cadastros").click();
		await expect.element(button("Cadastros")).toHaveAttribute("aria-expanded", "false");
		first.unmount();

		const second = await render(Harness, { persist: true, pathname: "/fin" });
		await expect.poll(title).toBe("Finance");
		await expect.element(button("Cadastros")).toHaveAttribute("aria-expanded", "true");
		second.unmount();

		await render(Harness, { persist: true, pathname: "/crm" });
		await expect.element(button("Cadastros")).toHaveAttribute("aria-expanded", "false");
	});

	it("sectionsDefaultOpen={false} starts sections closed", async () => {
		const screen = await render(Harness, { sectionsDefaultOpen: false });
		await expect.element(button("Cadastros")).toHaveAttribute("aria-expanded", "false");
		// A section's own `defaultOpen` still wins.
		await expect.element(button("Reports")).toHaveAttribute("aria-expanded", "true");
		await settled();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("the section holding the current page starts open", async () => {
		await render(Harness, { sectionsDefaultOpen: false, pathname: "/crm/clientes" });
		await expect.element(button("Cadastros")).toHaveAttribute("aria-expanded", "true");
	});

	it("navigating into a closed section opens it", async () => {
		const screen = await render(Harness, {});
		await button("Cadastros").click();
		await expect.element(button("Cadastros")).toHaveAttribute("aria-expanded", "false");
		(screen.component as unknown as Api).go("/crm/clientes");
		await expect.element(button("Cadastros")).toHaveAttribute("aria-expanded", "true");
		await expect
			.element(page.getByRole("link", { name: "Clientes" }))
			.toHaveAttribute("aria-current", "page");
	});
});
