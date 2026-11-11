import { defineGroup } from "../catalog.js";

const n = (v: number, locale: string) => v.toLocaleString(locale);

export const rating = defineGroup("rating", {
	en: {
		option: (v: number) => `${n(v, "en")} ${v === 1 ? "star" : "stars"}`,
		summary: (label: string, v: number, max: number) => `${label}: ${n(v, "en")} of ${max} stars`,
	},
	"pt-BR": {
		option: (v) => `${n(v, "pt-BR")} ${v === 1 ? "estrela" : "estrelas"}`,
		summary: (label, v, max) => `${label}: ${n(v, "pt-BR")} de ${max} estrelas`,
	},
});
