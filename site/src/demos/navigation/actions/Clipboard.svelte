<script lang="ts">
  import { clipboard } from '@codeatlasdev/ui/actions';

  let copied = $state(false);
  function done() {
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }
</script>

<button use:clipboard={'bun add @codeatlasdev/ui'} oncopy={done} class="btn">
  {copied ? 'Copied!' : 'Copy install command'}
</button>

<style>
  .btn {
    min-height: var(--ca-control-height);
    padding: 8px 20px;
    border-radius: var(--ca-radius-md);
    border: 1px solid var(--ca-outline-subtle);
    background: var(--ca-action-hover);
    cursor: pointer;
    font: inherit;
    font-size: var(--ca-font-size-body2);
    color: var(--ca-text-primary);
  }
</style>
