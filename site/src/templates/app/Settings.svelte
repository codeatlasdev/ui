<script lang="ts">
  import SettingsScreen from '../_shared/SettingsScreen.svelte';

  const langOpts = [
    { value: 'en', label: 'English'    },
    { value: 'pt', label: 'Portuguese' },
    { value: 'es', label: 'Spanish'    },
  ];

  const sessions = [
    { device: 'Chrome on macOS',  ip: '192.168.1.42',  last: 'Now',           current: true  },
    { device: 'Safari on iPhone', ip: '192.168.1.100', last: '2 hr ago',      current: false },
    { device: 'Firefox on Linux', ip: '10.0.0.55',     last: 'Sep 20, 09:11', current: false },
  ];
</script>

<SettingsScreen
  {langOpts}
  {sessions}
  copy={{
    timezoneLabel: 'Timezone',
    dangerTitle: 'Danger Zone',
    dangerDesc: 'Irreversible actions. Proceed with caution.',
    deleteDesc: 'Permanently delete this workspace and all its data.',
    emailDesc: 'Choose which events trigger an email to you.',
    paymentEventsDesc: 'Charges, failures, and refunds.',
    deployLabel: 'Deployment notifications',
    deployDesc: 'When a deployment completes or fails.',
    perfDesc: 'CPU, memory, and disk warnings.',
    digestDesc: 'Summary of key metrics every Monday.',
    invite: 'Invite member',
    mfaDesc: 'Require 2FA for all workspace members.',
    ssoDesc: 'Allow login via SAML or OIDC provider.',
    accessTitle: 'Access Control',
    accessDesc: 'Restrict access by IP.',
    ipLabel: 'IP allowlist',
    ipDesc: 'Only allow access from specific IP ranges.',
    ipRangesLabel: 'Allowed IP ranges',
    ipRangesDesc: 'Comma-separated CIDR ranges.',
    sessionsTitle: 'Active Sessions',
    currentChip: 'current',
    revoke: 'Revoke',
  }}
/>
