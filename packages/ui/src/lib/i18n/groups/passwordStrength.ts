import { defineGroup } from "../catalog.js";

export const passwordStrength = defineGroup("passwordStrength", {
	en: {
		name: "Password strength",
		empty: "Enter a password",
		weak: "Weak",
		fair: "Fair",
		strong: "Strong",
	},
	"pt-BR": {
		name: "Força da senha",
		empty: "Digite uma senha",
		weak: "Fraca",
		fair: "Média",
		strong: "Forte",
	},
});
