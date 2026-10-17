import { defineGroup } from "../catalog.js";

export const audioPlayer = defineGroup("audioPlayer", {
	en: {
		label: "Audio message",
		play: "Play",
		pause: "Pause",
		seek: "Seek",
		position: (now: string, total: string) => `${now} of ${total}`,
		rate: (r: string) => `Playback speed ${r}`,
		loading: "Loading audio…",
		error: "Could not play this audio",
	},
	"pt-BR": {
		label: "Mensagem de áudio",
		play: "Reproduzir",
		pause: "Pausar",
		seek: "Posição",
		position: (now: string, total: string) => `${now} de ${total}`,
		rate: (r: string) => `Velocidade ${r}`,
		loading: "Carregando áudio…",
		error: "Não foi possível reproduzir este áudio",
	},
});
