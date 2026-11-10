<script lang="ts">
  import { DEV } from 'esm-env';
  import { type SeoProps, seoMeta, seoTags } from './tags.js';

  let props: SeoProps = $props();

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
