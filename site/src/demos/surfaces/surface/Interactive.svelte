<script lang="ts">
  import { Surface } from '@codeatlasdev/ui';

  let count = $state(0);
</script>

<Surface
  as="button"
  type="button"
  interactive
  elevation={2}
  material="solid"
  radius="md"
  p="4"
  onclick={() => count++}
>
  Pressed {count} times
</Surface>
