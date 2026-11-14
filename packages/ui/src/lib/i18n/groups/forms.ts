import { defineGroup } from "../catalog.js";

export const forms = defineGroup("forms", {
	en: {
		phoneIncomplete: "Incomplete phone number",
		cepNotFound: "ZIP code not found",
		cepLookupFailed: "Could not look up the ZIP code",
		moneyNegative: "Negative",
	},
	"pt-BR": {
		phoneIncomplete: "Telefone incompleto",
		cepNotFound: "CEP não encontrado",
		cepLookupFailed: "Não foi possível consultar o CEP",
		moneyNegative: "Negativo",
	},
});
