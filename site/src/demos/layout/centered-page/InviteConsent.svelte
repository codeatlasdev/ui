<script lang="ts">
  import { AuthCard, Button, CenteredPage, SegmentedControl, Stack } from '@codeatlasdev/ui';

  let open = $state(false);
  let kind = $state<'invite' | 'consent'>('invite');
</script>

<Button variant="outlined" size="sm" onclick={() => (open = true)}>Open invite page</Button>

{#if open}
  <div class="overlay">
    <CenteredPage maxWidth="sm" mainId={null}>
      {#snippet brand()}<strong>Acme</strong>{/snippet}

      {#if kind === 'invite'}
        <AuthCard title="Join Acme" subtitle="Ana invited you to the Design workspace.">
          <Stack gap="3">
            <Button fullWidth>Accept invite</Button>
            <Button variant="outlined" fullWidth onclick={() => (open = false)}>Close</Button>
          </Stack>
        </AuthCard>
      {:else}
        <AuthCard title="Allow Notes to sign in?" subtitle="Notes will read your name and email. It cannot change your account.">
          <Stack gap="3">
            <Button fullWidth>Allow</Button>
            <Button variant="outlined" fullWidth onclick={() => (open = false)}>Deny</Button>
          </Stack>
        </AuthCard>
      {/if}

      <SegmentedControl
        aria-label="Page"
        bind:value={kind}
        items={[
          { value: 'invite', label: 'Invite' },
          { value: 'consent', label: 'Consent' },
        ]}
      />
    </CenteredPage>
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
