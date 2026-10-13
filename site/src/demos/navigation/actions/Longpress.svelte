<script lang="ts">
  import { longpress } from '@codeatlasdev/ui/actions';

  let fired = $state(false);
  function done() {
    fired = true;
    setTimeout(() => (fired = false), 1500);
  }
</script>

<button use:longpress={800} onlongpress={done} class="btn">
  {fired ? 'Long press!' : 'Press and hold (800ms)'}
</button>

<style>
  .btn {
    min-height: var(--ca-control-height);
    padding: 12px 24px;
    border-radius: var(--ca-radius-md);
    border: 1px solid var(--ca-outline-subtle);
    background: var(--ca-action-hover);
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    touch-action: manipulation;
    font: inherit;
    font-size: var(--ca-font-size-body2);
    color: var(--ca-text-primary);
  }
</style>
