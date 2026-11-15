import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { expectOpaqueSurface, withTheme } from "../../testing";
import AlertDialogHarness from "../AlertDialog/AlertDialog.test.svelte";
import DrawerHarness from "../Drawer/Drawer.test.svelte";
import DropdownHarness from "../DropdownMenu/DropdownMenu.test.svelte";
import PopoverHarness from "../Popover/Popover.test.svelte";
import SheetHarness from "../Sheet/Sheet.test.svelte";
import DialogHarness from "./Dialog.test.svelte";

// The opaque-overlay contract (#1158): a panel that carries text keeps a fill of alpha >= 0.9 in
// both schemes, on the default style and on the blurred ones, where the overlay tint is see-through.
const PANELS: [
	name: string,
	mount: () => ReturnType<typeof render>,
	trigger: string,
	panel: string,
][] = [
	["Dialog", () => render(DialogHarness), "Open", "dialog.ca-dialog"],
	["AlertDialog", () => render(AlertDialogHarness), "Delete item", "dialog.ca-alert-dialog"],
	["Drawer", () => render(DrawerHarness), "Open filters", "dialog.ca-drawer"],
	["Sheet", () => render(SheetHarness), "Open sheet", "dialog.ca-sheet"],
	["Popover", () => render(PopoverHarness), "Details", ".ca-popover-content"],
	["DropdownMenu", () => render(DropdownHarness), "Actions", ".ca-dropdown-content"],
];
const STYLES = ["solid", "glass", "frosted"] as const;
const SCHEMES = ["light", "dark"] as const;

const root = document.documentElement;
let restore = () => {};
afterEach(() => {
	restore();
	root.style.removeProperty("--ca-sheet-bg");
});

async function open(mount: () => ReturnType<typeof render>, trigger: string, panel: string) {
	await mount();
	await page.getByRole("button", { name: trigger }).click();
	await expect.poll(() => document.querySelector(panel)).toBeTruthy();
	return document.querySelector(panel) as HTMLElement;
}

describe("opaque overlay (#1158)", () => {
	for (const [name, mount, trigger, panel] of PANELS)
		for (const scheme of SCHEMES)
			for (const style of STYLES)
				it(`${name} ${scheme} ${style}`, async () => {
					restore = withTheme({ scheme, style });
					// `solid` is the default: the page carries no data-style at all.
					if (style === "solid") root.removeAttribute("data-style");
					await expectOpaqueSurface(await open(mount, trigger, panel));
				});

	it("a sheet token at alpha 0.8 fails the Dialog", async () => {
		root.style.setProperty(
			"--ca-sheet-bg",
			"color-mix(in oklab, var(--ca-surface-overlay) 80%, transparent)"
		);
		const el = await open(() => render(DialogHarness), "Open", "dialog.ca-dialog");
		await expect(expectOpaqueSurface(el)).rejects.toThrow(/alpha 0\.8\b.*below 0\.9/);
	});
});
