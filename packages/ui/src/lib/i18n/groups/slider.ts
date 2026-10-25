import { defineGroup } from "../catalog.js";

export const slider = defineGroup("slider", {
	en: {
		value: (value: number | string) => `Value ${value}`,
		minimum: "minimum",
		maximum: "maximum",
	},
	"pt-BR": {
		value: (value) => `Valor ${value}`,
		minimum: "mínimo",
		maximum: "máximo",
	},
});
