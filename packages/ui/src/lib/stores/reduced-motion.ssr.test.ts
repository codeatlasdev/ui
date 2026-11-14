import { render } from "svelte/server";
import { describe, expect, it } from "vitest";
import SegmentedControl from "../components/ToggleGroup/SegmentedControl.svelte";
import { reducedMotion } from "./reduced-motion.svelte.js";

// #1102: the server cannot read the preference, so it must assume reduced motion. Assuming `false` showed
// animations until hydration to the people who asked for none.
describe("reducedMotion on the server", () => {
	it("is true, so server markup renders without motion", () => {
		expect(reducedMotion.value).toBe(true);
		const { body } = render(SegmentedControl, {
			props: {
				value: "a",
				items: [
					{ value: "a", label: "A" },
					{ value: "b", label: "B" },
				],
			},
		});
		expect(body).toContain('data-no-motion=""');
	});
});
