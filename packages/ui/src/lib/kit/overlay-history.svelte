<script lang="ts">
  // Mount once in the root layout: the browser's Back (Android hardware Back, the iOS edge swipe, an
  // installed PWA's Back) closes the topmost modal layer instead of leaving the route. One history
  // entry per open Dialog, Sheet, Drawer, MobilePane, CommandPalette or Lightbox, pushed through
  // SvelteKit's shallow routing, so `page.state.caOverlays` carries the count and Kit never treats
  // the entries as navigations. Also keeps the in-app depth that `back(fallback)` reads.
  import { afterNavigate, beforeNavigate, goto } from '$app/navigation';
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { type OverlayBridge, bridgeOverlaysToHistory } from '../utils/overlay-history.js';
  import { trackNavigation } from './navigation-depth.js';

  interface OverlayPageState {
    caOverlays?: number;
  }
  const overlays = () => (page.state as OverlayPageState).caOverlays ?? 0;

  let bridge: OverlayBridge | undefined;
  let afterPop: (() => void) | undefined;

  onMount(() => {
    bridge = bridgeOverlaysToHistory({
      push: (n) => goto(location.href, { shallow: true, state: { caOverlays: n } as App.PageState, reset: false }),
      isStaleEntry: () => overlays() > 0,
    });
    return () => {
      bridge?.();
      bridge = undefined;
    };
  });

  // A navigation started while layers are open (a link inside a dialog, `goto`) would leave the
  // overlay entries under the new page. Cancel it, unwind them in one traversal, then re-issue it.
  beforeNavigate(({ cancel, to, type, willUnload }) => {
    if (type === 'popstate' || willUnload || !to || !bridge || bridge.entries() === 0) return;
    // Our own shallow push (and any same-URL state update) is not a page change.
    if (to.url.href === location.href) return;
    cancel();
    const target = to.url.href;
    // Kit handles the traversal itself (a popstate navigation to the entry under the layers): issue
    // the real navigation only once it has settled, or it is superseded by it.
    const { promise: settled, resolve } = Promise.withResolvers<void>();
    afterPop = resolve;
    setTimeout(resolve, 1500);
    void bridge.unwind().then(() => settled).then(() => goto(target));
  });

  afterNavigate((nav) => {
    const { type } = nav;
    // Only a popstate navigation carries a history delta.
    trackNavigation(type, type === 'popstate' ? nav.delta : undefined);
    if (type === 'popstate') {
      afterPop?.();
      afterPop = undefined;
    }
  });
</script>
