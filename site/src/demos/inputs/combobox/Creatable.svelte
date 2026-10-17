<script lang="ts">
  import { Combobox } from '@codeatlasdev/ui';

  let options = $state([
    { value: 'design', label: 'design' },
    { value: 'backend', label: 'backend' },
    { value: 'urgent', label: 'urgent' },
  ]);
  let tags = $state<string[]>([]);

  function onCreate(value: string) {
    options = [...options, { value, label: value }];
  }
</script>

<div class="col">
  <Combobox
    multiple
    creatable
    label="Tags"
    placeholder="Add tags"
    searchPlaceholder="Search or create a tag"
    {options}
    bind:value={tags}
    oncreate={onCreate}
  />
</div>

<style>
  .col {
    width: 100%;
    max-width: 360px;
  }
</style>
