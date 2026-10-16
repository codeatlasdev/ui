import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { settled } from "../../../../tests/settled";
import Harness from "./ModalContract.test.svelte";

/**
 * #225: "Dialog is not truly modal and nested overlays render below it". The contract pinned here:
 * while a Dialog is open the page behind it is inert (pointer and Tab), and every overlay opened
 * from inside it (Select, Popover, DropdownMenu, Tooltip) is in the top layer, inside the modal,
 * hit-testable at its centre and painted above the dialog.
 */

async function openDialog() {
	const screen = await render(Harness);
	await screen.getByRole("button", { name: "Open dialog" }).click();
	await expect.element(page.getByRole("dialog")).toBeVisible();
	await settled();
	return screen;
}

const dialogEl = () => document.querySelector("dialog") as HTMLDialogElement;

function assertOnTop(layer: HTMLElement) {
	const dialog = dialogEl();
	expect(layer.matches(":popover-open")).toBe(true);
	expect(dialog.contains(layer)).toBe(true);
	const r = layer.getBoundingClientRect();
	expect(r.width).toBeGreaterThan(0);
	const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
	expect(hit && layer.contains(hit), "layer is the hit target at its centre").toBe(true);
}

describe("Dialog modality", () => {
	it("is :modal and the page behind is inert: pointer does nothing", async () => {
		await openDialog();
		const dialog = dialogEl();
		expect(dialog.matches(":modal")).toBe(true);

		const bg = document.querySelector("#app-shell > button") as HTMLElement;
		const r = bg.getBoundingClientRect();
		const x = r.left + r.width / 2;
		const y = r.top + r.height / 2;
		// Hit-testing under a modal skips everything outside it, so the pointer lands on the dialog or its scrim.
		expect(document.elementFromPoint(x, y)).not.toBe(bg);
		await userEvent.click(document.body, { position: { x, y } });
		expect(document.querySelector("[data-testid='background-count']")?.textContent).toBe("0");
	});

	it("Tab never lands on a control behind the dialog (forward and backward)", async () => {
		await openDialog();
		const dialog = dialogEl();
		const stops = new Set<Element | null>();
		for (let i = 0; i < 12; i++) {
			await userEvent.keyboard("{Tab}");
			stops.add(document.activeElement);
			const a = document.activeElement;
			expect(a === document.body || dialog.contains(a), `Tab stop ${i} stays in the dialog`).toBe(
				true
			);
		}
		for (let i = 0; i < 12; i++) {
			await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
			const a = document.activeElement;
			expect(
				a === document.body || dialog.contains(a),
				`Shift+Tab stop ${i} stays in the dialog`
			).toBe(true);
		}
		const bg = document.querySelector("#app-shell > button");
		expect(stops.has(bg)).toBe(false);
	});

	it("the background subtree is not reachable by the accessibility tree focus order (inert)", async () => {
		await openDialog();
		const bg = document.querySelector("#app-shell > button") as HTMLElement;
		bg.focus();
		expect(document.activeElement).not.toBe(bg);
	});
});

describe("overlays opened from inside a Dialog", () => {
	it("Select: listbox is inside the modal, on top, and an option is selectable", async () => {
		await openDialog();
		await page.getByRole("button", { name: "Role" }).click();
		const list = document.querySelector('[role="listbox"]') as HTMLElement;
		await expect.element(page.getByRole("listbox")).toBeVisible();
		assertOnTop(list);
		await page.getByRole("option", { name: "Beta" }).click();
		expect(document.querySelector("[data-testid='picked']")?.textContent).toBe("b");
		expect(dialogEl().open).toBe(true);
	});

	it("Popover: content is inside the modal, on top, and its button is clickable", async () => {
		await openDialog();
		await page.getByRole("button", { name: "Details" }).click();
		const pop = document.querySelector(".ca-popover-content") as HTMLElement;
		await expect.element(page.getByText("Popover content")).toBeVisible();
		assertOnTop(pop);
		await page.getByRole("button", { name: "Inner action" }).click();
		expect(dialogEl().open).toBe(true);
	});

	it("DropdownMenu: menu is inside the modal, on top, and an item is clickable", async () => {
		await openDialog();
		await page.getByRole("button", { name: "Actions" }).click();
		const menu = document.querySelector('[role="menu"]') as HTMLElement;
		await expect.element(page.getByRole("menu")).toBeVisible();
		assertOnTop(menu);
		await page.getByRole("menuitem", { name: "Rename" }).click();
		expect(dialogEl().open).toBe(true);
	});

	it("Tooltip: bubble is inside the modal and on top", async () => {
		await openDialog();
		await page.getByText("Hint").hover();
		await expect.element(page.getByRole("tooltip")).toBeVisible();
		const tip = document.querySelector('[role="tooltip"]') as HTMLElement;
		expect(tip.matches(":popover-open")).toBe(true);
		expect(dialogEl().contains(tip)).toBe(true);
	});

	it("an overlay stays on top when it is opened, closed and reopened in the same dialog", async () => {
		await openDialog();
		const trigger = page.getByRole("button", { name: "Role" });
		for (let i = 0; i < 2; i++) {
			await trigger.click();
			await expect.element(page.getByRole("listbox")).toBeVisible();
			assertOnTop(document.querySelector('[role="listbox"]') as HTMLElement);
			await userEvent.keyboard("{Escape}");
			await expect.element(page.getByRole("listbox")).not.toBeInTheDocument();
			expect(dialogEl().open).toBe(true);
		}
	});

	it("a page popover still open when a shortcut opens the dialog moves into it, on top", async () => {
		await render(Harness);
		await page.getByRole("button", { name: "Page popover" }).click();
		await expect.element(page.getByRole("button", { name: "Page action" })).toBeVisible();
		await userEvent.keyboard("{Meta>}k{/Meta}");
		await expect.poll(() => dialogEl()?.matches(":modal")).toBe(true);
		await settled();

		const action = [...document.querySelectorAll<HTMLElement>("button")].find(
			(b) => b.textContent === "Page action"
		) as HTMLElement;
		const pop = action.closest(".ca-popover-content") as HTMLElement;
		assertOnTop(pop);
		await page.getByRole("button", { name: "Page action" }).click();
		expect(dialogEl().open).toBe(true);
	});
});
