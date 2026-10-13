import type { Messages } from "./state.svelte.js";

/** Português (Brasil). Mesma forma de `en.ts`; chave faltando é erro de tipo. */
export const ptBR: Messages = {
	common: {
		close: "Fechar",
		back: "Voltar",
		copy: "Copiar",
		copied: "Copiado",
		clear: "Limpar",
		search: "Buscar",
		loading: "Carregando…",
		dismiss: "Dispensar",
		new: "Novo",
		noResults: "Nenhum resultado",
		of: "de",
	},
	alert: {
		dismiss: "Dispensar alerta",
	},
	alertDialog: {
		confirm: "Confirmar",
		cancel: "Cancelar",
	},
	appForm: {
		back: "Voltar",
		actions: "Ações do formulário",
	},
	kpiCard: {
		trend: (label) => `Tendência: ${label}`,
	},
	appList: {
		searchPlaceholder: "Buscar…",
		clear: "Limpar",
		selected: (count) => `${count} ${count === 1 ? "selecionado" : "selecionados"}`,
		listContent: "Conteúdo da lista",
		empty: "Nenhum resultado.",
	},
	appSettings: {
		navigation: "Navegação das configurações",
		content: "Conteúdo das configurações",
	},
	appShell: {
		moduleNavigation: "Navegação de módulos",
		sectionNavigation: "Navegação da seção",
		unread: (count) => `${count} ${count === 1 ? "não lida" : "não lidas"}`,
		new: "Novo",
		openNavigation: "Abrir navegação",
		closeNavigation: "Fechar navegação",
	},
	avatar: {
		status: { online: "Online", offline: "Offline", away: "Ausente", busy: "Ocupado" },
	},
	button: {
		/** Announced when a `loading` button stops loading. */
		loaded: "Carregamento concluído",
	},
	skipLink: {
		label: "Ir para o conteúdo",
	},
	badge: {
		new: "Novo",
		notifications: (count) => `${count} ${count === 1 ? "notificação" : "notificações"}`,
	},
	breadcrumb: {
		label: "Trilha de navegação",
		home: "Início",
	},
	calendar: {
		label: "Data",
		rangeLabel: "Período",
		previousMonth: "Mês anterior",
		nextMonth: "Próximo mês",
		openCalendar: "Abrir calendário",
	},
	chip: {
		remove: (label) => `Remover ${label}`,
	},
	codeSnippet: {
		copy: "Copiar",
		copied: "Copiado",
		copyCode: "Copiar código",
	},
	combobox: {
		placeholder: "Selecione…",
		searchPlaceholder: "Buscar…",
		empty: "Nenhum resultado",
	},
	commandPalette: {
		dialog: "Paleta de comandos",
		commands: "Comandos",
		placeholder: "Buscar…",
		empty: (query) => `Nenhum resultado para "${query}"`,
	},
	copyButton: {
		label: "Copiar",
		copied: "Copiado",
		failed: "Não foi possível copiar",
	},
	dataTable: {
		export: "Exportar CSV",
		exportShort: "CSV",
		columns: "Colunas",
		searchPlaceholder: "Buscar…",
		noResults: "Nenhum resultado",
		noResultsSub: "Nada corresponde à busca atual.",
		clearSearch: "Limpar busca",
		noOptions: "Sem opções",
		clearFilter: "Limpar filtro",
		rows: "Linhas",
		rowsPerPage: "Linhas por página",
		previousPage: "Página anterior",
		nextPage: "Próxima página",
	},
	dialog: {
		close: "Fechar",
	},
	docs: {
		toc: "Nesta página",
		nav: "Páginas",
		navigation: "Navegação",
		sections: "Seções",
		skipToContent: "Ir para o conteúdo",
		sectionNavigation: "Navegação da seção",
		openNavigation: "Abrir navegação",
		search: {
			label: "Buscar na documentação",
			short: "Buscar",
			placeholder: "Ex.: enviar imagem, webhook, QR code",
			hint: "Busque por endpoint, conceito ou provider.",
			close: "Fechar",
			results: "Resultados",
			empty: (query) => `Nada encontrado para “${query}”.`,
			failed: "Não foi possível carregar o índice de busca.",
			loading: "Carregando índice…",
		},
		language: "Linguagem",
		toggleTheme: "Alternar tema",
		copyCode: "Copiar código",
		copy: "Copiar",
		copied: "Copiado",
		callout: {
			note: "Nota",
			tip: "Dica",
			caution: "Atenção",
			danger: "Perigo",
		},
	},
	drawer: {
		close: "Fechar",
	},
	errorPage: {
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
	fileUpload: {
		label: "Solte arquivos aqui ou clique para procurar",
		remove: (name) => `Remover ${name}`,
		tooLarge: (name, maxMb) => `${name}: maior que ${maxMb} MB`,
	},
	forms: {
		phoneIncomplete: "Telefone incompleto",
		cepNotFound: "CEP não encontrado",
		cepLookupFailed: "Não foi possível consultar o CEP",
	},
	lightbox: {
		close: "Fechar",
	},
	mobilePane: {
		back: "Voltar",
	},
	notificationBell: {
		label: (unread) => `Notificações (${unread} ${unread === 1 ? "não lida" : "não lidas"})`,
		title: "Notificações",
		markAll: "Marcar todas como lidas",
		clear: "Limpar",
		empty: "Nenhuma notificação",
	},
	numberField: {
		decrease: "Diminuir",
		increase: "Aumentar",
	},
	pagination: {
		previous: "Página anterior",
		next: "Próxima página",
	},
	table: {
		scrollRegion: "Tabela com rolagem",
	},
	select: {
		placeholder: "Selecione…",
		required: "obrigatório",
	},
	sheet: {
		close: "Fechar",
		panel: "Painel",
	},
	slider: {
		value: (value) => `Valor ${value}`,
	},
	spinner: {
		label: "Carregando…",
	},
	stepper: {
		label: "Progresso",
		step: (n, label, done) => `Etapa ${n}: ${label}${done ? " (concluída)" : ""}`,
	},
	themeToggle: {
		label: "Alternar esquema de cores",
	},
	toast: {
		region: "Notificações",
		dismiss: "Dispensar",
	},
	charts: {
		high: "Alto",
		low: "Baixo",
	},
	kit: {
		defaultError: "Ocorreu um erro inesperado.",
	},
};
