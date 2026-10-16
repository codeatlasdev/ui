<script lang="ts">
  import { DEV } from 'esm-env';
  import { serializeJsonLd } from './jsonld.js';

  interface OpenGraph {
    /** @default "website" */
    type?: string;
    /** Absolute image URL, 1200x630. */
    image?: string;
    /** Used when `image` is not set: the site-wide card, passed once from the root layout. */
    defaultImage?: string;
    imageAlt?: string;
    /** @default "image/png" */
    imageType?: string;
    imageWidth?: number;
    imageHeight?: number;
    /** e.g. `"pt_BR"`. */
    locale?: string;
    localeAlternates?: string[];
    siteName?: string;
  }

  interface Twitter {
    /** @default "summary_large_image" */
    card?: 'summary' | 'summary_large_image';
    /** `@handle` of the site. */
    site?: string;
  }

  interface Props {
    title: string;
    /** `%s` is replaced by `title`. Skipped when the title already equals the site name. @default "%s" */
    titleTemplate?: string;
    description?: string;
    /** Absolute URL of this page. Required on indexable pages. */
    canonical?: string;
    /** @default "index,follow" */
    robots?: string;
    /** Shorthand for `robots="noindex,nofollow"`. */
    noindex?: boolean;
    /** Translations of this page, including itself and an `x-default` entry. */
    alternates?: { hreflang: string; href: string }[];
    og?: OpenGraph;
    twitter?: Twitter;
    /** One node, an array, or a `graph()` document. */
    jsonLd?: object | object[];
    /** Link to the web app manifest, e.g. `"/manifest.webmanifest"`. */
    manifest?: string;
    /**
     * BCP 47 language of the page, e.g. `"pt-BR"`. Sets `og:locale` (`pt_BR`) when `og.locale` is
     * not given and keeps `<html lang>` in sync on the client. The server-rendered `<html lang>`
     * belongs in `app.html`.
     */
    lang?: string;
  }

  let {
    title,
    titleTemplate = '%s',
    description,
    canonical,
    robots = 'index,follow',
    noindex = false,
    alternates,
    og,
    twitter,
    jsonLd,
    manifest,
    lang,
  }: Props = $props();

  let fullTitle = $derived(titleTemplate.replace('%s', title));
  let directives = $derived(noindex ? 'noindex,nofollow' : robots);
  let indexable = $derived(!directives.includes('noindex'));
  let ld = $derived(jsonLd ? serializeJsonLd(jsonLd) : undefined);
  let image = $derived(og?.image ?? og?.defaultImage);
  let locale = $derived(og?.locale ?? lang?.replace('-', '_'));

  $effect(() => {
    if (lang && document.documentElement.lang !== lang) document.documentElement.lang = lang;
  });

  $effect(() => {
    if (DEV && indexable && !canonical)
      console.warn(
        `[ca-ui] <Seo> "${title}": no canonical URL on an indexable page. Duplicate URLs (query strings, trailing slashes) will compete in search. Pass canonical or noindex.`
      );
  });
</script>

<svelte:head>
  <title>{fullTitle}</title>
  {#if description}<meta name="description" content={description} />{/if}
  {#if canonical}<link rel="canonical" href={canonical} />{/if}
  <meta name="robots" content={directives} />
  {#each alternates ?? [] as alt (alt.hreflang)}
    <link rel="alternate" hreflang={alt.hreflang} href={alt.href} />
  {/each}

  <meta property="og:type" content={og?.type ?? 'website'} />
  <meta property="og:title" content={fullTitle} />
  {#if description}<meta property="og:description" content={description} />{/if}
  {#if canonical}<meta property="og:url" content={canonical} />{/if}
  {#if og?.siteName}<meta property="og:site_name" content={og.siteName} />{/if}
  {#if locale}<meta property="og:locale" content={locale} />{/if}
  {#each og?.localeAlternates ?? [] as locale (locale)}
    <meta property="og:locale:alternate" content={locale} />
  {/each}
  {#if image}
    <meta property="og:image" content={image} />
    <meta property="og:image:type" content={og?.imageType ?? 'image/png'} />
    {#if og?.imageAlt}<meta property="og:image:alt" content={og.imageAlt} />{/if}
    <meta property="og:image:width" content={String(og?.imageWidth ?? 1200)} />
    <meta property="og:image:height" content={String(og?.imageHeight ?? 630)} />
  {/if}

  <meta name="twitter:card" content={image ? (twitter?.card ?? 'summary_large_image') : 'summary'} />
  <meta name="twitter:title" content={fullTitle} />
  {#if description}<meta name="twitter:description" content={description} />{/if}
  {#if image}<meta name="twitter:image" content={image} />{/if}
  {#if twitter?.site}<meta name="twitter:site" content={twitter.site} />{/if}

  {#if manifest}<link rel="manifest" href={manifest} />{/if}
  {#if ld}{@html `<script type="application/ld+json">${ld}</script>`}{/if}
</svelte:head>
