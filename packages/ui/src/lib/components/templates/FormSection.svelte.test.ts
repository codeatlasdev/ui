import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { q } from "../../../../tests/dom";
import FormSection from "./FormSection.svelte";
import InPages from "./FormSectionInPages.test.svelte";

const levels = (root: Element) =>
	[...root.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => `${h.tagName}:${h.textContent}`);

describe("FormSection heading level", () => {
	it("stays an h5 outside a page shell", async () => {
		const screen = await render(FormSection, { title: "Theme" });
		expect(q(screen.container, ".ca-form-section__title").tagName).toBe("H5");
	});

	it("headingLevel sets the tag", async () => {
		const screen = await render(FormSection, { title: "Theme", headingLevel: 3 });
		expect(q(screen.container, ".ca-form-section__title").tagName).toBe("H3");
	});

	it("is an h2 under the AppSettings h1, like PageShell", async () => {
		const screen = await render(InPages, { page: "settings" });
		expect(levels(screen.container)).toEqual(["H1:Settings", "H2:Theme", "H2:Nothing here"]);
		expect(await checkA11y(screen.container, { runOnly: ["heading-order"] })).toHaveNoViolations();
	});

	it("is an h2 under the AppForm h1", async () => {
		const screen = await render(InPages, { page: "form" });
		expect(levels(screen.container)).toEqual(["H1:New user", "H2:Account"]);
		expect(await checkA11y(screen.container, { runOnly: ["heading-order"] })).toHaveNoViolations();
	});

	it("an explicit headingLevel wins over the page default", async () => {
		const screen = await render(InPages, { page: "settings", headingLevel: 3 });
		expect(levels(screen.container)[1]).toBe("H3:Theme");
	});
});
