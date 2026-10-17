<!--
  Type test (checked by `bun run check`, not rendered): with `href` the anchor's own attributes
  are accepted (#290); without it only button attributes are. Each `@ts-expect-error` must fire,
  otherwise svelte-check reports it as unused.
-->
<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import Button from './Button.svelte';

  type Props = ComponentProps<typeof Button>;

  // A link takes the anchor's attributes.
  const download: Props = { href: '/file.txt', download: 'file.txt' };
  const bareDownload: Props = { href: '/file.txt', download: '' };
  const external: Props = {
    href: 'https://example.com',
    target: '_blank',
    rel: 'nofollow',
    hreflang: 'pt-BR',
    type: 'text/plain',
    ping: '/ping',
    referrerpolicy: 'no-referrer',
  };
  const stateful: Props = { href: '/go', variant: 'outlined', size: 'sm', loading: true, 'data-x': 1 };
  // A button takes the button's.
  const submit: Props = { type: 'submit', form: 'f', formaction: '/save', name: 'intent', value: 'save' };
  const reset: Props = { type: 'reset', disabled: true };
  void [download, bareDownload, external, stateful, submit, reset];

  // @ts-expect-error `download` belongs to a link: it needs `href`
  const downloadNoHref: Props = { download: 'file.txt' };
  // @ts-expect-error `hreflang` belongs to a link: it needs `href`
  const hreflangNoHref: Props = { hreflang: 'pt-BR' };
  // @ts-expect-error `rel` belongs to a link: it needs `href`
  const relNoHref: Props = { rel: 'nofollow' };
  // @ts-expect-error `formaction` belongs to a button: a link rejects it
  const linkFormaction: Props = { href: '/x', formaction: '/save' };
  // @ts-expect-error `form` belongs to a button: a link rejects it
  const linkForm: Props = { href: '/x', form: 'f' };
  // @ts-expect-error a link's `type` is a MIME string: without `href` only button/submit/reset fit
  const mimeNoHref: Props = { type: 'text/plain' };
  void [downloadNoHref, hreflangNoHref, relNoHref, linkFormaction, linkForm, mimeNoHref];
</script>

<Button href="/file.txt" download="file.txt">Download</Button>
<Button href="/file.txt" download>Download</Button>
<Button href="https://example.com" target="_blank" rel="nofollow" hreflang="pt-BR" type="text/plain">Docs</Button>
<Button href="/go" ping="/ping" referrerpolicy="no-referrer">Go</Button>
<Button type="submit" form="f" formaction="/save" name="intent" value="save">Save</Button>
<Button type="reset" disabled>Reset</Button>
