import { defineGroup } from "../catalog.js";

export const mediaGrid = defineGroup("mediaGrid", {
	en: {
		label: "Media",
		open: (title: string, n: number, total: number) => `Open ${title}, ${n} of ${total}`,
		image: "Image",
		video: "Video",
		document: "Document",
		moreCount: (n: number) => `+${n} more`,
		failed: "Could not load",
	},
	"pt-BR": {
		label: "Mídia",
		open: (title: string, n: number, total: number) => `Abrir ${title}, ${n} de ${total}`,
		image: "Imagem",
		video: "Vídeo",
		document: "Documento",
		moreCount: (n: number) => `+${n}`,
		failed: "Não foi possível carregar",
	},
});
