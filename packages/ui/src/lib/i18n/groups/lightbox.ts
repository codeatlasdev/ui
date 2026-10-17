import { defineGroup } from "../catalog.js";

export const lightbox = defineGroup("lightbox", {
	en: {
		close: "Close",
		previous: "Previous",
		next: "Next",
		download: "Download",
		counter: (n: number, total: number) => `${n} / ${total}`,
	},
	"pt-BR": {
		close: "Fechar",
		previous: "Anterior",
		next: "Próxima",
		download: "Baixar",
		counter: (n: number, total: number) => `${n} / ${total}`,
	},
});
