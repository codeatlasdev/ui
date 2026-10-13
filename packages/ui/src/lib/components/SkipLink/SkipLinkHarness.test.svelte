<script lang="ts">
  import type { Snippet } from 'svelte';
  import SkipLink from './SkipLink.svelte';

  let { href, target = 'main', children }: { href?: string; target?: string; children?: Snippet } = $props();
</script>

<SkipLink {href} {children} />
<nav><a href="/x">Other</a></nav>
<main id={target} tabindex="-1"><h1>Page</h1></main>
