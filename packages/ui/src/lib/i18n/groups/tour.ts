import { defineGroup } from "../catalog.js";

export const tour = defineGroup("tour", {
	en: {
		next: "Next",
		back: "Back",
		done: "Done",
		skip: "Skip tour",
		progress: (step: number, total: number) => `${step} of ${total}`,
	},
	"pt-BR": {
		next: "Próximo",
		back: "Voltar",
		done: "Concluir",
		skip: "Pular tour",
		progress: (step, total) => `${step} de ${total}`,
	},
});
