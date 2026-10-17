<script lang="ts">
  import { Button, FileUpload } from '@codeatlasdev/ui';

  let upload = $state<ReturnType<typeof FileUpload> | null>(null);
  let names = $state<string[]>([]);

  function onpick(picked: File[]) {
    names = [...names, ...picked.map((f) => f.name)];
  }
</script>

<div class="wrap">
  <div class="head">
    <h3 class="title">Attachments</h3>
    <Button size="sm" onclick={() => upload?.open()}>Add files</Button>
  </div>
  <FileUpload bind:this={upload} list={false} multiple onchange={onpick} data-testid="attachments-input" />
  {#if names.length > 0}
    <ul class="list">
      {#each names as name, i (i)}
        <li>{name}</li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .wrap {
    width: 100%;
    max-width: 480px;
  }

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ca-space-3);
    margin-block-end: var(--ca-space-2);
  }

  .title {
    margin: 0;
    font-size: var(--ca-font-size-h6);
  }

  .list {
    margin: var(--ca-space-2) 0 0;
    padding-inline-start: var(--ca-space-5);
    font-size: var(--ca-font-size-body2);
    color: var(--ca-text-secondary);
  }
</style>
