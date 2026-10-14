import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import Harness from "./ExternalLink.test.svelte";

describe("ExternalLink", () => {
	it("opens in a new tab without leaking the opener", async () => {
		const screen = await render(Harness, {});
		const a = screen.container.querySelector("a") as HTMLAnchorElement;
		expect(a.getAttribute("href")).toBe("https://example.com/buy");
		expect(a.target).toBe("_blank");
		expect(a.rel.split(" ").sort()).toEqual(["noopener", "noreferrer"]);
	});

	it("tells screen readers it opens in a new tab, and hides the icon", async () => {
		const screen = await render(Harness, {});
		await expect
			.element(screen.getByRole("link", { name: "Buy at registrar (opens in a new tab)" }))
			.toBeVisible();
		const icon = screen.container.querySelector(".ca-external-link__icon") as Element;
		expect(icon.getAttribute("aria-hidden")).toBe("true");
	});

	it("keeps the SR hint when the icon is hidden", async () => {
		const screen = await render(Harness, { showIcon: false });
		expect(screen.container.querySelector(".ca-external-link__icon")).toBeNull();
		await expect
			.element(screen.getByRole("link", { name: "Buy at registrar (opens in a new tab)" }))
			.toBeVisible();
	});

	it("has no axe violations", async () => {
		const screen = await render(Harness, {});
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});
