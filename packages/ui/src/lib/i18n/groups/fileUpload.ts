import { defineGroup } from "../catalog.js";

export const fileUpload = defineGroup("fileUpload", {
	en: {
		label: "Drop files here or click to browse",
		remove: (name: string) => `Remove ${name}`,
		tooLarge: (name: string, maxMb: string) => `${name}: larger than ${maxMb} MB`,
	},
	"pt-BR": {
		label: "Solte arquivos aqui ou clique para procurar",
		remove: (name) => `Remover ${name}`,
		tooLarge: (name, maxMb) => `${name}: maior que ${maxMb} MB`,
	},
});
