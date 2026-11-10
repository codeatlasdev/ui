<script lang="ts">
  import { DEV } from 'esm-env';
  import { type SeoProps, seoMeta, seoTags } from './tags.js';

  // Own members (not `extends SeoProps`) so the manifest and the docs tables list each prop;
  // the types come from `SeoProps`, so the tag logic and its inputs stay in `tags.ts`.
  interface Props {
    title: SeoProps['title'];
    /** `%s` is replaced by `title`. Skipped when the title already equals the site name. @default "%s" */
    titleTemplate?: SeoProps['titleTemplate'];
    description?: SeoProps['description'];
    /** Absolute URL of this page. Required on indexable pages. */
    canonical?: SeoProps['canonical'];
    /** @default "index,follow" */
    robots?: SeoProps['robots'];
    /** Shorthand for `robots="noindex,nofollow"`. */
    noindex?: SeoProps['noindex'];
    /** Translations of this page, including itself and an `x-default` entry. */
    alternates?: SeoProps['alternates'];
    og?: SeoProps['og'];
    twitter?: SeoProps['twitter'];
    /** One node, an array, or a `graph()` document. */
    jsonLd?: SeoProps['jsonLd'];
    /** Link to the web app manifest, e.g. `"/manifest.webmanifest"`. */
    manifest?: SeoProps['manifest'];
    /** BCP 47 language of the page, e.g. `"pt-BR"`. Sets `og:locale` and keeps `<html lang>` in sync on the client. */
    lang?: SeoProps['lang'];
  }

  let props: Props = $props();

  let seo = $derived(seoTags(props));
  let indexable = $derived(seo.indexable);

  $effect(() => {
    const lang = props.lang;
    if (lang && document.documentElement.lang !== lang) document.documentElement.lang = lang;
  });

  $effect(() => {
    if (DEV && indexable && !props.canonical)
      console.warn(
        `[ca-ui] <Seo> "${props.title}": no canonical URL on an indexable page. Duplicate URLs (query strings, trailing slashes) will compete in search. Pass canonical or noindex.`
      );
  });
</script>

<!-- One string builder for every framework: Svelte and Astro cannot drift apart. -->
<svelte:head>
  <title>{seo.title}</title>
  {@html seoMeta(seo)}
</svelte:head>
