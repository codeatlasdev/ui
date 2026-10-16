import { describe, expect, it } from "bun:test";
import { buildSurfaces, extractSurfaces } from "../scripts/build-manifest.ts";
import { STYLES } from "../src/lib/theme/define.ts";

const css = `
/* ── Solid — opaque, no blur, no glow (the package default) ── */
[data-style="solid"] {
  --ca-blur-regular: none;
  --ca-overlay-blur: none;
  --ca-glass-rim: transparent;
}

/* ── Frosted — reduced blur, less dramatic ── */
[data-style="frosted"] {
  --ca-blur-regular: blur(12px) saturate(165%);
  --ca-overlay-blur: blur(8px) saturate(155%);
}

/* ── Opaque material styles ── */
[data-style="outlined"],
[data-style="clay"] {
  --ca-blur-regular: none;
}

[data-style="outlined"] {
  --ca-mat-edge: inset 0 0 0 1px red;
}

.dark[data-style="clay"] {
  --ca-mat-edge: none;
}
`;

describe("extractSurfaces", () => {
	it("reads one entry per [data-style] id, merging grouped and dark selectors", () => {
		const out = extractSurfaces(css);
		expect(out.map((s) => s.id)).toEqual(["solid", "frosted", "outlined", "clay"]);
		const outlined = out.find((s) => s.id === "outlined");
		expect(outlined?.tokens).toEqual(["--ca-blur-regular", "--ca-mat-edge"]);
		const clay = out.find((s) => s.id === "clay");
		expect(clay?.tokens).toEqual(["--ca-blur-regular", "--ca-mat-edge"]);
	});

	it("classifies the blur: none when every blur token is none, reduced when rewritten, tokens listed", () => {
		const byId = Object.fromEntries(extractSurfaces(css).map((s) => [s.id, s]));
		expect(byId.solid?.blur).toBe("none");
		expect(byId.frosted?.blur).toBe("reduced");
		expect(byId.outlined?.blur).toBe("none");
	});

	it("takes the description from the comment above the block", () => {
		const byId = Object.fromEntries(extractSurfaces(css).map((s) => [s.id, s]));
		expect(byId.solid?.description).toContain("opaque, no blur");
		expect(byId.frosted?.description).toContain("reduced blur");
	});
});

describe("buildSurfaces (the real materials.css)", () => {
	const surfaces = buildSurfaces();
	const byId = Object.fromEntries(surfaces.map((s) => [s.id, s]));

	it("lists every SurfaceStyle exactly once, in STYLES order", () => {
		expect(surfaces.map((s) => s.id)).toEqual([...STYLES]);
	});

	it("glass has no [data-style] block: it is the full-blur :root set", () => {
		expect(byId.glass).toMatchObject({ blur: "full", tokens: [] });
	});

	it("solid, flat, outlined, neumorphic, clay and tonal draw no blur; frosted reduces it; chrome keeps it", () => {
		for (const id of ["solid", "flat", "outlined", "neumorphic", "clay", "tonal"])
			expect(byId[id]?.blur, id).toBe("none");
		expect(byId.frosted?.blur).toBe("reduced");
		expect(byId.chrome?.blur).toBe("full");
	});

	it("marks the package default and names the recipes that default to each style", () => {
		expect(surfaces.filter((s) => s.packageDefault).map((s) => s.id)).toEqual(["solid"]);
		expect(byId.glass?.recipes).toContain("liquid");
		expect(byId.outlined?.recipes).toContain("brutalism");
	});
});
