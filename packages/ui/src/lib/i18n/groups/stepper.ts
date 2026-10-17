import { defineGroup } from "../catalog.js";

export const stepper = defineGroup("stepper", {
	en: {
		label: "Progress",
		step: (n: number, label: string, done: boolean) =>
			`Step ${n}: ${label}${done ? " (done)" : ""}`,
	},
	"pt-BR": {
		label: "Progresso",
		step: (n, label, done) => `Etapa ${n}: ${label}${done ? " (concluída)" : ""}`,
	},
});
