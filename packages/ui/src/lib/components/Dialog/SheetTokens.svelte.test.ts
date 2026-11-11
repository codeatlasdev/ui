import { afterEach, describe, expect, it } from "vitest";
import { cdp, page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { settled } from "../../../../tests/settled";
import AlertDialogHarness from "../AlertDialog/AlertDialog.test.svelte";
import DrawerHarness from "../Drawer/Drawer.test.svelte";
import DialogHarness from "./Dialog.test.svelte";

const GLASS = {
	"--ca-sheet-bg": "rgba(10, 20, 30, 0.4)",
	"--ca-sheet-blur": "blur(12px)",
	"--ca-sheet-border": "rgb(1, 2, 3)",
	"--ca-sheet-shadow": "rgb(4, 5, 6) 0px 0px 0px 1px",
};

const root = document.documentElement;
afterEach(async () => {
	await cdp().send("Emulation.setEmulatedMedia", { features: [] });
	for (const k of Object.keys(GLASS)) root.style.removeProperty(k);
	root.removeAttribute("data-style");
});

const panels: [string, () => ReturnType<typeof render>, string][] = [
	["Dialog", () => render(DialogHarness), "Open"],
	["Drawer", () => render(DrawerHarness), "Open filters"],
	["AlertDialog", () => render(AlertDialogHarness), "Delete item"],
];

async function open(mount: () => ReturnType<typeof render>, label: string) {
	await mount();
	await page.getByRole("button", { name: label }).click();
	await settled();
	const el = page
		.getByRole("dialog")
		.or(page.getByRole("alertdialog"))
		.element() as HTMLDialogElement;
	return el;
}

describe("sheet tokens on :root (#674)", () => {
	for (const [name, mount, label] of panels) {
		it(`${name}: the four tokens make the panel glass, no selector`, async () => {
			for (const [k, v] of Object.entries(GLASS)) root.style.setProperty(k, v);
			const cs = getComputedStyle(await open(mount, label));
			expect(cs.backgroundColor).toBe("rgba(10, 20, 30, 0.4)");
			expect(cs.backdropFilter).toContain("blur(12px)");
			expect(cs.boxShadow).toBe("rgb(4, 5, 6) 0px 0px 0px 1px");
			expect(cs.borderTopColor).toBe("rgb(1, 2, 3)");
		});

		it(`${name}: prefers-reduced-transparency drops the blur and the glass fill`, async () => {
			for (const [k, v] of Object.entries(GLASS)) root.style.setProperty(k, v);
			await cdp().send("Emulation.setEmulatedMedia", {
				features: [{ name: "prefers-reduced-transparency", value: "reduce" }],
			});
			const el = await open(mount, label);
			const cs = getComputedStyle(el);
			const solid = getComputedStyle(root).getPropertyValue("--ca-glass-tint-solid").trim();
			const probe = Object.assign(document.createElement("i"), { style: `color:${solid}` });
			document.body.append(probe);
			expect(cs.backdropFilter).toBe("none");
			expect(cs.backgroundColor).toBe(getComputedStyle(probe).color);
			probe.remove();
		});

		it(`${name}: unset tokens keep the solid panel`, async () => {
			const cs = getComputedStyle(await open(mount, label));
			expect(cs.backdropFilter).toBe("none");
			expect(cs.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
		});
	}
});
