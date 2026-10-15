<script lang="ts">
  /**
   * SurfacePanel — a raised `<section>` (elevation 2; with an accessible name it is a region landmark) for a labelled block of a page:
   * a filter bar, a settings group, a side summary. Give it an accessible name.
   *
   *   <SurfacePanel aria-label="Filters" p="4">…</SurfacePanel>
   *
   * Not the AppShell sidebar `Panel`: that one is the navigation drawer of the shell.
   */
  import type { ComponentProps } from 'svelte';
  import Surface from '../Surface/Surface.svelte';

  type Props = Omit<ComponentProps<typeof Surface>, 'as'>;

  let { elevation = 2, class: className = '', children, ...rest }: Props = $props();
</script>

<Surface as="section" {elevation} class="ca-surface-panel {className}" {...rest}>
  {@render children?.()}
</Surface>
