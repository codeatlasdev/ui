import { defineGroup } from "../catalog.js";

export const map = defineGroup("map", {
	en: {
		region: "Map",
		controls: "Map controls",
		zoomIn: "Zoom in",
		zoomOut: "Zoom out",
		resetNorth: "Reset north",
		locate: "Show my location",
		locateFailed: "Could not get your location",
	},
	"pt-BR": {
		region: "Mapa",
		controls: "Controles do mapa",
		zoomIn: "Aproximar",
		zoomOut: "Afastar",
		resetNorth: "Voltar ao norte",
		locate: "Mostrar minha localização",
		locateFailed: "Não foi possível obter sua localização",
	},
});
