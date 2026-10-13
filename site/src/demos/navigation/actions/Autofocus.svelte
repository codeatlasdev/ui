<script lang="ts">
  import { Button } from '@codeatlasdev/ui';
  import { autofocus } from '@codeatlasdev/ui/actions';

  let key = $state(0);
</script>

<Button onclick={() => key++}>Remount input</Button>
{#key key}
  <input use:autofocus placeholder="Focused on mount" class="input" aria-label="Autofocused input" />
{/key}

<style>
  .input {
    min-height: var(--ca-control-height);
    flex-basis: 100%;
    padding: 8px 12px;
    border-radius: var(--ca-radius-md);
    border: 1px solid var(--ca-outline-subtle);
    background: transparent;
    color: var(--ca-text-primary);
    font: inherit;
    font-size: var(--ca-font-size-body2);
  }
</style>
