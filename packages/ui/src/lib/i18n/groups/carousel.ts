import { defineGroup } from "../catalog.js";

export const carousel = defineGroup("carousel", {
	en: {
		previous: "Previous slide",
		next: "Next slide",
		goTo: (n: number) => `Go to slide ${n}`,
		slide: (n: number, total: number) => `${n} of ${total}`,
		pause: "Pause autoplay",
		play: "Start autoplay",
	},
	"pt-BR": {
		previous: "Slide anterior",
		next: "Próximo slide",
		goTo: (n) => `Ir para o slide ${n}`,
		slide: (n, total) => `${n} de ${total}`,
		pause: "Pausar a reprodução automática",
		play: "Iniciar a reprodução automática",
	},
});
