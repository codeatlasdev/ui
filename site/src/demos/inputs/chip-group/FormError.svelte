<script lang="ts">
  import { Button, ChipGroup } from '@codeatlasdev/ui';

  let size = $state('');
  let error = $state<string | undefined>();

  const sizes = [
    { value: '1', label: 'Just me' },
    { value: '2-5', label: '2 to 5' },
    { value: '6-20', label: '6 to 20' },
  ];

  function submit(e: SubmitEvent) {
    e.preventDefault();
    error = size ? undefined : 'Choose a team size.';
  }
</script>

<form onsubmit={submit} novalidate>
  <ChipGroup
    label="Sales team size"
    name="teamSize"
    items={sizes}
    bind:value={size}
    {error}
    required
    onchange={() => (error = undefined)}
  />
  <Button type="submit" variant="filled">Continue</Button>
</form>
