import { createRawSnippet } from "svelte";
import { afterEach, describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import Button from "../components/Button/Button.svelte";
import DialogHarness from "../components/Dialog/Dialog.test.svelte";
import TextField from "../components/TextField/TextField.svelte";
import TooltipHarness from "../components/Tooltip/Tooltip.test.svelte";

/**
 * Contract (AGENTS.md "Cascade and overriding tokens"): component CSS lives in `@layer ca.components`,
 * app CSS is unlayered, so an app rule with the SAME single-class selector as the kit's wins without
 * doubled classes or `!important`. Each rule below is exactly what the docs tell an app to write.
 */
const appCss = document.createElement("style");
appCss.dataset.testid = "app-css";

/** `first` puts the app sheet BEFORE every component sheet: the layer must win regardless of order. */
function appRules(css: string, first = false) {
	appCss.textContent = css;
	if (first) document.head.prepend(appCss);
	else document.head.append(appCss);
}

afterEach(() => appCss.remove());

const label = (text: string) => createRawSnippet(() => ({ render: () => `<span>${text}</span>` }));

describe("app CSS overrides component CSS (unlayered beats @layer ca.components)", () => {
	it("Button: .ca-btn:disabled / .ca-btn--filled:disabled", async () => {
		appRules(`
			.ca-btn:disabled { opacity: 0.11; }
			.ca-btn--filled:disabled { background-color: rgb(1, 2, 3); }
		`);
		const screen = await render(Button, { children: label("Save"), disabled: true });
		const btn = screen.getByRole("button", { name: "Save" }).element() as HTMLElement;
		const cs = getComputedStyle(btn);
		expect(cs.opacity).toBe("0.11");
		expect(cs.backgroundColor).toBe("rgb(1, 2, 3)");
	});

	it("Button: .ca-btn--destructive", async () => {
		appRules(`.ca-btn--destructive { background-color: rgb(4, 5, 6); }`);
		const screen = await render(Button, { children: label("Delete"), variant: "destructive" });
		const btn = screen.getByRole("button", { name: "Delete" }).element() as HTMLElement;
		expect(getComputedStyle(btn).backgroundColor).toBe("rgb(4, 5, 6)");
	});

	it("TextField: .ca-tf__wrap", async () => {
		appRules(`.ca-tf__wrap { border-radius: 13px; }`);
		const screen = await render(TextField, { label: "Name" });
		void screen;
		const wrap = document.querySelector(".ca-tf__wrap") as HTMLElement;
		expect(getComputedStyle(wrap).borderTopLeftRadius).toBe("13px");
	});

	it("TextField: .ca-tf__wrap--error border (error state is not !important)", async () => {
		appRules(".ca-tf__wrap--error { border-color: rgb(7, 8, 9); }");
		await render(TextField, { label: "Name", error: "Required" });
		const wrap = document.querySelector(".ca-tf__wrap--error") as HTMLElement;
		expect(getComputedStyle(wrap).borderTopColor).toBe("rgb(7, 8, 9)");
	});

	it("Tooltip: .ca-tooltip-content", async () => {
		appRules(`.ca-tooltip-content { padding: 17px; }`, true);
		await render(TooltipHarness);
		await userEvent.tab();
		await expect.element(page.getByRole("tooltip")).toBeVisible();
		const tip = document.querySelector(".ca-tooltip-content") as HTMLElement;
		expect(getComputedStyle(tip).paddingTop).toBe("17px");
	});

	it("Dialog: .ca-dialog__body (same specificity as .ca-dialog--chromeless .ca-dialog__body)", async () => {
		appRules(`.ca-dialog__body { padding: 0; }`, true);
		const screen = await render(DialogHarness, { chromeless: true });
		await screen.getByRole("button", { name: "Open" }).click();
		const body = document.querySelector(".ca-dialog__body") as HTMLElement;
		expect(getComputedStyle(body).paddingTop).toBe("0px");
	});
});
