import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { settled } from "../../../../tests/settled";
import Harness from "./PanelFocus.test.svelte";

/**
 * #1059: WebKit puts a modal <dialog> in the sequential focus order, so after a blur the first Tab
 * landed on the panel itself, and the panel had `outline: none`: one Tab lost with nothing on
 * screen. The panel is now out of the Tab order (`tabindex="-1"`, Chromium already skipped it) and
 * draws the focus ring whenever keyboard focus does land on it (no focusable child, a script).
 */
describe.each(["dialog", "alert", "drawer", "sheet"] as const)("%s panel focus (#1059)", (kind) => {
	it("is no Tab stop, and keyboard focus on it shows the ring", async () => {
		await render(Harness, { kind });
		await settled();
		const panel = document.querySelector("dialog.ca-overlay") as HTMLDialogElement;
		expect(panel.open).toBe(true);
		// WebKit makes a <dialog> without tabindex a Tab stop; Chromium's default already skips it.
		expect(panel.getAttribute("tabindex"), "out of the sequential focus order").toBe("-1");
		await userEvent.tab();
		panel.focus();
		expect(document.activeElement).toBe(panel);
		expect(panel.matches(":focus-visible")).toBe(true);
		expect(getComputedStyle(panel).outlineStyle).toBe("solid");
		await userEvent.tab();
		expect(document.activeElement).not.toBe(panel);
		expect(panel.contains(document.activeElement)).toBe(true);
	});
});
