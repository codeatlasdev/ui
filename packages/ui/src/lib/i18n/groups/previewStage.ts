import { defineGroup } from "../catalog.js";

export const previewStage = defineGroup("previewStage", {
	en: {
		device: "Preview width",
		fill: "Fill",
		resize: "Resize preview width",
		readout: (px: number) => `${px} px`,
		loading: "Loading preview",
	},
	"pt-BR": {
		device: "Largura da prévia",
		fill: "Preencher",
		resize: "Redimensionar largura da prévia",
		readout: (px: number) => `${px} px`,
		loading: "Carregando prévia",
	},
});
