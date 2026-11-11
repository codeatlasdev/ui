import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadEngine } from "../src/lib/map/loader.js";

// #712: `import(/* @vite-ignore */ "mapbox-gl")` left a bare specifier in the built client chunk, so
// `engine="mapbox"` threw in production (browsers cannot resolve it). The library cannot name
// `mapbox-gl` for the bundler (it is an optional peer: apps without it would fail to build), so the
// app passes `engine={() => import("mapbox-gl")}` and its own bundler resolves the package.
describe("map engine loader", () => {
	it("never hides a bare specifier from the bundler", () => {
		const source = readFileSync(join(import.meta.dir, "../src/lib/map/loader.ts"), "utf8");
		expect(source).not.toMatch(/@vite-ignore/);
	});

	it("loads the engine module the app imported (a bundler-visible import)", async () => {
		class FakeMap {}
		const gl = await loadEngine("mapbox", async () => ({ default: { Map: FakeMap } }) as never);
		expect(gl.Map).toBe(FakeMap);
	});

	it("takes a namespace module without a default export", async () => {
		class FakeMap {}
		const gl = await loadEngine("mapbox", async () => ({ Map: FakeMap }) as never);
		expect(gl.Map).toBe(FakeMap);
	});

	it("a loader that fails still names the peer to install", async () => {
		const failing = loadEngine("mapbox", async () => {
			throw new Error("Cannot find module 'mapbox-gl'");
		});
		await expect(failing).rejects.toThrow(
			'[ca-ui] <MapStage engine="mapbox"> needs the optional peer "mapbox-gl": install it'
		);
	});

	it("a bare mapbox engine without a loader names the engineModule prop", async () => {
		await expect(loadEngine("mapbox")).rejects.toThrow(
			/engineModule=\{\(\) => import\("mapbox-gl"\)\}/
		);
	});
});
