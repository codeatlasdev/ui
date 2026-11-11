<script lang="ts">
  import type { Snippet } from 'svelte';
  import SettingsScreen from '../_shared/SettingsScreen.svelte';

  const langOpts = [
    { value: 'en', label: 'English'    },
    { value: 'pt', label: 'Portuguese' },
    { value: 'es', label: 'Spanish'    },
    { value: 'fr', label: 'French'     },
  ];

  const sessions = [
    { device: 'Chrome no macOS',  ip: '192.168.1.42',  last: 'Agora',         current: true  },
    { device: 'Safari on iPhone', ip: '192.168.1.100', last: '2 hr ago',      current: false },
    { device: 'Firefox no Linux', ip: '10.0.0.55',     last: '20 Set, 09:11', current: false },
  ];
</script>

<SettingsScreen
  {langOpts}
  {sessions}
  listLayout="list"
  {ipFieldWrap}
  copy={{
    timezoneLabel: 'Time zone',
    dangerTitle: 'Danger zone',
    dangerDesc: 'Irreversible actions.',
    deleteDesc: 'Permanently deletes this workspace and all of its data.',
    emailDesc: 'Which events send you an email.',
    paymentEventsDesc: 'Charges, failures and refunds.',
    deployLabel: 'Deploy notifications',
    deployDesc: 'When a deploy finishes or fails.',
    perfDesc: 'CPU, memory and disk.',
    digestDesc: 'Key metrics every Monday.',
    invite: 'Convidar membro',
    mfaDesc: 'Require 2FA for all members.',
    ssoDesc: 'Login via provedor SAML ou OIDC.',
    accessTitle: 'Controle de acesso',
    accessDesc: 'Restrinja o acesso por IP.',
    ipLabel: 'IP allow list',
    ipDesc: 'Only allow access from specific ranges.',
    ipRangesLabel: 'Ranges permitidos',
    ipRangesDesc: 'Comma-separated CIDRs.',
    sessionsTitle: 'Active sessions',
    currentChip: 'atual',
    revoke: 'Revogar',
  }}
/>

{#snippet ipFieldWrap(field: Snippet)}
  <div class="ip-reveal">{@render field()}</div>
{/snippet}

<style>
  .ip-reveal { padding-top: 12px; }
</style>
