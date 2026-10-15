import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import Releases from "./Releases.test.svelte";

const css = (el: Element, prop: string) => getComputedStyle(el).getPropertyValue(prop);

describe("ca-release (changelog markup inside .ca-prose)", () => {
	it("passes axe", async () => {
		const screen = await render(Releases);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("separates releases with a rule and keeps anchored headings clear of a sticky header", async () => {
		const screen = await render(Releases);
		const section = screen.container.querySelector(".ca-release");
		expect(section).toBeTruthy();
		expect(css(section as Element, "border-top-width")).not.toBe("0px");
		expect(css(section as Element, "scroll-margin-top")).not.toBe("0px");
	});

	it("lays the meta line out as a wrapping row of 44px-tall links", async () => {
		const screen = await render(Releases);
		const meta = screen.container.querySelector(".ca-release__meta") as Element;
		expect(css(meta, "display")).toBe("flex");
		expect(css(meta, "flex-wrap")).toBe("wrap");
		for (const a of meta.querySelectorAll("a")) {
			expect(a.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
		}
	});

	it("the version jump list is a wrapping row of pills", async () => {
		const screen = await render(Releases);
		const list = screen.container.querySelector(".ca-release-jump ul") as Element;
		expect(css(list, "display")).toBe("flex");
		expect(css(list, "list-style-type")).toBe("none");
		for (const a of screen.container.querySelectorAll(".ca-release-jump a")) {
			expect(a.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
		}
	});

	it("the thanks footer is set apart from the last release", async () => {
		const screen = await render(Releases);
		const thanks = screen.container.querySelector(".ca-release-thanks") as Element;
		expect(css(thanks, "border-top-width")).not.toBe("0px");
	});
});
