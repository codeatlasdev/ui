import { defineGroup } from "../catalog.js";

export const kpiCard = defineGroup("kpiCard", {
	en: {
		trend: (label: string) => `Trend: ${label}`,
		trendJudged: (label: string, better: boolean) =>
			`Trend: ${label}, ${better ? "better" : "worse"}`,
	},
	"pt-BR": {
		trend: (label) => `Tendência: ${label}`,
		trendJudged: (label, better) => `Tendência: ${label}, ${better ? "melhor" : "pior"}`,
	},
});
