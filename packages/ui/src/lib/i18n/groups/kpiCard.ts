import { defineGroup } from "../catalog.js";

export const kpiCard = defineGroup("kpiCard", {
	en: {
		trend: (label: string) => `Trend: ${label}`,
	},
	"pt-BR": {
		trend: (label) => `Tendência: ${label}`,
	},
});
