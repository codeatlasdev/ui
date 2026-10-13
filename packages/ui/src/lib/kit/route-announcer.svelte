<script lang="ts">
  // Announces client-side navigations to screen readers. SvelteKit ships its own
  // `#svelte-announcer`, but it only reads `document.title` and is not available to
  // other routers or localised; this one shares the package live region and falls back
  // to the page `<h1>` when a route has no title of its own.
  import { afterNavigate } from '$app/navigation';
  import { announce } from '../utils/announce.js';

  interface Props {
    /** Prefix spoken before the title, e.g. "Navigated to". Omit to speak the title alone. */
    prefix?: string;
  }

  let { prefix }: Props = $props();

  afterNavigate(({ type }) => {
    // `enter` is the first load: the browser already announces a fresh document.
    if (type === 'enter') return;
    // Wait a frame so the new route has set <title> / rendered its <h1>.
    requestAnimationFrame(() => {
      const title = document.title.trim() || document.querySelector('h1')?.textContent?.trim();
      if (title) announce(prefix ? `${prefix} ${title}` : title);
    });
  });
</script>
