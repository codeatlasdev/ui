<script lang="ts">
  import { AuthLayout, AuthCard, Button, SegmentedControl, Stack } from '@codeatlasdev/ui';

  let open = $state(false);
  let tone = $state<'brand' | 'flat'>('flat');
</script>

<Button variant="outlined" size="sm" onclick={() => (open = true)}>Open sign-in page</Button>

{#if open}
  <div class="overlay">
    <AuthLayout logoName="Acme" panelTone={tone}>
      {#snippet panel()}
        <p class="auth-quote__text">Ship the boring parts in a day.</p>
      {/snippet}

      <AuthCard title="Welcome back" subtitle="Panel tone: {tone}">
        <Stack gap="3">
          <SegmentedControl
            aria-label="Panel tone"
            bind:value={tone}
            items={[
              { value: 'flat', label: 'Flat' },
              { value: 'brand', label: 'Brand' },
            ]}
          />
          <Button variant="outlined" onclick={() => (open = false)}>Close</Button>
        </Stack>
      </AuthCard>
    </AuthLayout>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: var(--ca-z-modal);
    overflow: auto;
    background: var(--ca-surface-base);
  }
</style>
