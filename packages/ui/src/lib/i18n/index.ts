export { default as I18nProvider } from "./I18nProvider.svelte";
export type { DeepPartial, Locale, Messages, MessagesOverride } from "./state.svelte.js";
export {
	getLocales,
	getMessages,
	locale,
	registerLocale,
	setLocale,
	useLocale,
	useT,
} from "./state.svelte.js";
