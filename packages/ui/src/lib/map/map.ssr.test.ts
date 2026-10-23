import { render } from "svelte/server";
import { describe, expect, it } from "vitest";
import { mapColors, tokenColor } from "./index.js";
import Harness from "./MapStage.test.svelte";

describe("map SSR", () => {
	it("renders the stage and controls on the server without loading an engine", () => {
		const { body } = render(Harness, { props: {} });
		expect(body).toContain('role="region"');
		expect(body).toContain('aria-label="Test map"');
		expect(body).toContain('aria-label="Zoom in"');
		expect(body).toContain("disabled");
	});

	it("tokenColor and mapColors are transparent black without a DOM", () => {
		expect(tokenColor("--ca-brand-main")).toEqual([0, 0, 0, 0]);
		expect(mapColors().brand).toEqual([0, 0, 0, 0]);
	});
});
