<script lang="ts">
  /**
   * I18nProvider: request/tree-scoped UI language. SSR-safe (no module state), reactive to prop
   * changes. Everything rendered inside reads its strings from `locale`.
   *
   * @example
   * <I18nProvider locale={data.locale}><slot /></I18nProvider>
   */
  import type { Snippet } from 'svelte';
  import { provideI18n, type Locale, type MessagesOverride } from './state.svelte.js';

  interface Props {
    /** BCP 47 tag. `en` and `pt-BR` are built in; add others with `registerLocale`. */
    locale: Locale;
    /** Deep override merged over the locale's catalog. */
    messages?: MessagesOverride;
    children?: Snippet;
  }

  let { locale, messages, children }: Props = $props();

  provideI18n(() => ({ locale, messages }));
</script>

{@render children?.()}
