import { afterEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import Button from "../components/Button/Button.svelte";
import TextField from "../components/TextField/TextField.svelte";

/**
 * #351: `:root { font-size: var(--ca-font-size-body1) }` made the body text size the root `rem`,
 * so a 14px body (`--ca-font-size-body1: 0.875rem`) shrank every rem token by 12.5%.
 * The root keeps the user-agent size; body1 only styles the text.
 */
afterEach(() => {
	document.documentElement.style.removeProperty("--ca-font-size-body1");
});

const px = (el: Element) => getComputedStyle(el).fontSize;

describe("body text size is independent from the root rem (#351)", () => {
	it("keeps .ca-btn and the field label size when body1 changes", async () => {
		const screen = await render(TextField, { label: "Name", value: "" });
		const btn = await render(Button, { children: undefined, "aria-label": "go" });
		const label = screen.container.querySelector("label") as HTMLElement;
		const button = btn.container.querySelector(".ca-btn") as HTMLElement;
		const before = { label: px(label), button: px(button), root: px(document.documentElement) };

		document.documentElement.style.setProperty("--ca-font-size-body1", "0.875rem");

		expect(px(document.documentElement)).toBe(before.root);
		expect(px(label)).toBe(before.label);
		expect(px(button)).toBe(before.button);
		expect(px(document.body)).toBe("14px");
	});
});
