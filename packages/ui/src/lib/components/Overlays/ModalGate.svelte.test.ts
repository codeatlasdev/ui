import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { layers } from "../../stores/layers.svelte.js";
import Harness from "./ModalGate.test.svelte";

/**
 * #550: a panel that opens under a modal (an edge peek in Atlas) is a bug class, so the kit's
 * hover-opened UI consults the layer stack and stays shut while a modal is open, unless its
 * trigger lives inside that modal. `layers.modalOpen` is the same signal for an app's own UI.
 */
async function openModal() {
	await render(Harness);
	await page.getByRole("button", { name: "Open modal" }).click();
	await expect.element(page.getByRole("dialog")).toBeVisible();
}

/** The dialog is modal, so the page behind it is inert: Playwright cannot hover it. Fire the pointer ourselves. */
function moveOver(el: Element) {
	el.dispatchEvent(
		new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse", clientX: 5, clientY: 5 })
	);
}

describe("layers.modalOpen", () => {
	it("follows the modal: false, true while open, false after Escape", async () => {
		await render(Harness);
		const out = page.getByTestId("modal-open");
		await expect.element(out).toHaveTextContent("false");
		await page.getByRole("button", { name: "Open modal" }).click();
		await expect.element(out).toHaveTextContent("true");
		expect(layers.modalOpen).toBe(true);
		await userEvent.keyboard("{Escape}");
		await expect.element(out).toHaveTextContent("false");
		expect(layers.modalOpen).toBe(false);
	});
});

describe("hover UI stays shut under a modal", () => {
	it("Tooltip behind the modal does not open on pointer movement", async () => {
		await openModal();
		moveOver(page.getByText("Behind", { exact: true }).element());
		await new Promise((r) => setTimeout(r, 150));
		expect(
			document.querySelector(".ca-tooltip-content[data-state=open], [role=tooltip]")
		).toBeNull();
	});

	it("HoverCard behind the modal does not open", async () => {
		await openModal();
		moveOver(page.getByRole("link", { name: "@behind" }).element());
		await new Promise((r) => setTimeout(r, 150));
		expect(document.querySelector(".ca-hovercard-content")).toBeNull();
	});

	it("NavigationMenu behind the modal does not open its panel", async () => {
		await openModal();
		moveOver(page.getByRole("button", { name: "Behind products" }).element());
		await new Promise((r) => setTimeout(r, 150));
		expect(document.querySelector(".ca-navmenu-panel")).toBeNull();
	});
});

describe("a trigger inside the modal still works", () => {
	it("Tooltip inside the dialog opens", async () => {
		await openModal();
		await userEvent.hover(page.getByText("Inside", { exact: true }));
		await expect.element(page.getByRole("tooltip")).toHaveTextContent("Inside tip");
	});

	it("submenu inside the dialog still opens on hover", async () => {
		await openModal();
		await page.getByRole("button", { name: "Inside menu" }).click();
		await userEvent.hover(page.getByRole("menuitem", { name: "Inside sub" }));
		await expect.element(page.getByRole("menuitem", { name: "Inside item" })).toBeVisible();
	});
});
