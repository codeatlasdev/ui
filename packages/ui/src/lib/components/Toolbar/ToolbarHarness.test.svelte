<script lang="ts">
  import Button from '../Button/Button.svelte';
  import Select from '../Select/Select.svelte';
  import TextField from '../TextField/TextField.svelte';
  import Toolbar from './Toolbar.svelte';
</script>

<div style="width: 640px">
  <Toolbar aria-label="Filters">
    <TextField label="Search" hideLabel placeholder="Search" />
    <Select label="Status" hideLabel options={[{ value: 'a', label: 'Active' }]} />
    <span class="ca-toolbar-spacer"></span>
    <span data-last><Button>Export</Button></span>
  </Toolbar>
</div>
