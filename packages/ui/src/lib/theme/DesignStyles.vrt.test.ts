import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { applyTheme, SCHEMES, vrtReady } from "../../../tests/vrt";
import Matrix from "./DesignStylesMatrix.test.svelte";
import { DESIGN_STYLES, type DesignStyleId } from "./styles.js";

// One recipe × scheme snapshot: a token change that flattens a design style fails here,
// not silently in consumer apps. `default` is the sober solid look; `liquid` keeps the
// former glass default covered.
describe("design styles (vrt)", () => {
	it("every recipe has a row, liquid included", () => {
		expect(Object.keys(DESIGN_STYLES)).toEqual(expect.arrayContaining(["default", "liquid"]));
	});

	for (const id of Object.keys(DESIGN_STYLES) as DesignStyleId[]) {
		for (const scheme of SCHEMES) {
			it(`${id} / ${scheme}`, async () => {
				applyTheme({ scheme, style: DESIGN_STYLES[id].theme.defaultStyle ?? "solid" });
				await render(Matrix, { id });
				await vrtReady();
				await expect.element(page.getByTestId("matrix")).toMatchScreenshot(`style-${id}-${scheme}`);
			});
		}
	}
});
