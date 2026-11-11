import { defineGroup } from "../catalog.js";

export const pageShell = defineGroup("pageShell", {
	en: {
		aside: "Page sidebar",
		/** Name of the menu button that holds the header actions that do not fit (those without `data-priority="primary"`). */
		more: "More",
	},
	"pt-BR": {
		aside: "Barra lateral da página",
		more: "Mais",
	},
});
