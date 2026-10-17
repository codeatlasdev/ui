import { defineGroup } from "../catalog.js";

export const chip = defineGroup("chip", {
	en: {
		remove: (label: string) => `Remove ${label}`,
	},
	"pt-BR": {
		remove: (label) => `Remover ${label}`,
	},
});
