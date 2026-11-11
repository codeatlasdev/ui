<script lang="ts">
  import Select from './Select/Select.svelte';
  const options = [{ value: 'a', label: 'Alpha' }];
</script>

<div class="auto" style="display:flex;width:800px"><Select label="A" {options} width="auto" /></div>
<div class="full" style="display:flex;width:800px"><Select label="A" {options} /></div>
