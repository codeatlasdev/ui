import { describe, expect, it } from "bun:test";
import { overlayStep } from "../src/lib/utils/overlay-history.ts";

// One history entry per open modal layer: the bridge pushes when a layer opened, pops when one
// closed without Back, and does nothing when the counts agree.
describe("overlayStep (#725)", () => {
	const cases: Array<[number, number, "push" | "pop" | "idle"]> = [];
	for (let open = 0; open <= 3; open++)
		for (let entries = 0; entries <= 3; entries++)
			cases.push([open, entries, open > entries ? "push" : open < entries ? "pop" : "idle"]);

	it.each(cases)("open=%i entries=%i -> %s", (open, entries, expected) => {
		expect(overlayStep(open, entries)).toBe(expected);
	});
});
