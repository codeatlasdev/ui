import { defineGroup } from "../catalog.js";

export const errorPage = defineGroup("errorPage", {
	en: {
		defaultMessage: "An unexpected error occurred.",
		fallbackTitle: "Something went wrong",
		404: {
			title: "Page not found",
			hint: "The page you're looking for doesn't exist or was moved.",
		},
		403: { title: "Access denied", hint: "You don't have permission to access this resource." },
		500: {
			title: "Internal server error",
			hint: "Something went wrong on our end. We're looking into it.",
		},
		503: {
			title: "Service unavailable",
			hint: "The server is temporarily unavailable. Try again shortly.",
		},
		goBack: "Go back",
		home: "Home",
	},
	"pt-BR": {
		defaultMessage: "Ocorreu um erro inesperado.",
		fallbackTitle: "Algo deu errado",
		404: {
			title: "Página não encontrada",
			hint: "A página que você procura não existe ou foi movida.",
		},
		403: { title: "Acesso negado", hint: "Você não tem permissão para acessar este recurso." },
		500: {
			title: "Erro interno do servidor",
			hint: "Algo deu errado do nosso lado. Já estamos verificando.",
		},
		503: {
			title: "Serviço indisponível",
			hint: "O servidor está temporariamente indisponível. Tente novamente em instantes.",
		},
		goBack: "Voltar",
		home: "Início",
	},
});
