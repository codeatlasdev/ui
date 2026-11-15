<script lang="ts">
  import { TextArea } from '@codeatlasdev/ui';

  let post = $state('Shipping the new release notes today.');
  let report = $state('');
</script>

<div class="col">
  <TextArea
    label="Post"
    description="Posts over 280 characters cannot be sent."
    bind:value={post}
    counter={{ max: 280 }}
    rows={3}
  />
  <TextArea
    label="Report details"
    description="The count appears from 400 characters."
    bind:value={report}
    maxlength={500}
    counter={{ from: 400 }}
    rows={3}
  />
</div>

<style>
  .col {
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-4);
    width: 100%;
    max-width: 480px;
  }
</style>
