import { defineGroup } from "../catalog.js";

export const slider = defineGroup("slider", {
	en: {
		value: (value: number | string) => `Value ${value}`,
	},
	"pt-BR": {
		value: (value) => `Valor ${value}`,
	},
});
