import { describe, expect, it } from "bun:test";
import { vrtSteps } from "../../../scripts/vrt.ts";

// `bun run test:vrt -- ColorPicker` ran all 87 files: the args landed in `sh -c`'s $0 (#1004).
describe("test:vrt forwards a filter", () => {
	it("passes the filter to the package run and skips the site pages", () => {
		expect(vrtSteps(["ColorPicker"], false)).toEqual([
			{ cwd: "packages/ui", cmd: ["bun", "run", "test:vrt", "ColorPicker"] },
		]);
	});

	it("runs both suites without a filter, and update passes through", () => {
		expect(vrtSteps([], true)).toEqual([
			{ cwd: "packages/ui", cmd: ["bun", "run", "test:vrt:update"] },
			{ cwd: "site", cmd: ["bun", "run", "test:vrt:update"] },
		]);
	});
});
