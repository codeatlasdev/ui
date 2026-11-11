import { render } from "svelte/server";
import { describe, expect, it } from "vitest";
import Harness from "./MasterDetail.test.svelte";

// #744: the server cannot know the width (`responsive.width` is undefined until hydration), so
// the server HTML alone must already hold the structure that CSS turns into list-only or split.
const html = (props: object) => render(Harness, { props }).body;

describe("MasterDetail on the server (#744)", () => {
	it("renders the list, the empty state and the detail dialog before hydration", () => {
		const body = html({});
		expect(body).toContain("ca-md__master");
		expect(body).toContain("Open maria");
		expect(body).toContain("ca-md__detail");
		expect(body).toContain("Select a conversation");
	});

	it("a preselected row puts the thread in the server HTML once, not in a second tree", () => {
		const body = html({ selected: "maria" });
		expect(body.match(/data-testid="thread"/g)).toHaveLength(1);
		expect(body).toContain("Chat maria");
	});

	it("the width switch is in the CSS (a container), not a width the server would have to know", () => {
		const body = html({});
		expect(body).toContain("ca-md--md");
		expect(body).not.toContain('data-state="modal"');
	});
});
