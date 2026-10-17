import { defineGroup } from "../catalog.js";

export const installPrompt = defineGroup("installPrompt", {
	en: {
		title: "Install this app",
		description: "Add it to your home screen for quick access, full screen and offline use.",
		install: "Install",
		dismiss: "Dismiss install prompt",
		iosShare: "Tap Share in the browser toolbar.",
		iosAdd: 'Choose "Add to Home Screen".',
	},
	"pt-BR": {
		title: "Instalar este app",
		description: "Adicione à tela inicial para acesso rápido, tela cheia e uso offline.",
		install: "Instalar",
		dismiss: "Dispensar convite de instalação",
		iosShare: "Toque em Compartilhar na barra do navegador.",
		iosAdd: 'Escolha "Adicionar à Tela de Início".',
	},
});
