import { defineGroup } from "../catalog.js";

export const colorField = defineGroup("colorField", {
	en: {
		invalid: "Use #rrggbb, rgb() or oklch()",
		pick: (label: string) => `Pick a color for ${label}`,
		pass: (level: string) => (level === "fail" ? "" : `Passes ${level}`),
		fail: (min: number) => `Below ${min}:1`,
	},
	"pt-BR": {
		invalid: "Use #rrggbb, rgb() ou oklch()",
		pick: (label) => `Escolher cor para ${label}`,
		pass: (level) => (level === "fail" ? "" : `Passa ${level}`),
		fail: (min) => `Abaixo de ${min}:1`,
	},
});
