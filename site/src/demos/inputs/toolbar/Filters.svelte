<script lang="ts">
  import { Button, NumberField, Select, TextField, Toolbar } from '@codeatlasdev/ui';

  let status = $state('open');
</script>

<Toolbar aria-label="Filter deals">
  <TextField label="Search" hideLabel placeholder="Search deals" width="14rem" />
  <Select
    label="Status"
    hideLabel
    width="10rem"
    bind:value={status}
    options={[
      { value: 'open', label: 'Open' },
      { value: 'won', label: 'Won' },
      { value: 'lost', label: 'Lost, waiting for the customer to answer' },
    ]}
  />
  <NumberField label="Day" hideLabel steppers={false} width="6rem" min={0} max={90} value={7} />
  <span class="ca-toolbar-spacer"></span>
  <Button variant="outlined" tone="neutral">Export</Button>
</Toolbar>
