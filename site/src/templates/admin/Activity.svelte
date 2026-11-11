<script lang="ts">
  import ActivityScreen from '../_shared/ActivityScreen.svelte';
  import type { ActivityEvent } from '../_shared/ActivityScreen.svelte';

  const events: ActivityEvent[] = [
    { id: 'e1',  actor: 'Hana Park',    action: 'joined',           target: 'Pro plan',              time: '2 min ago',    category: 'user',    variant: 'success' },
    { id: 'e2',  actor: 'System',       action: 'deployed',         target: 'v2.4.1 to production',  time: '18 min ago',   category: 'system',  variant: 'info'    },
    { id: 'e3',  actor: 'Ana Lima',     action: 'invited',          target: 'ivan@stack.io',         time: '34 min ago',   category: 'user',    variant: 'default' },
    { id: 'e4',  actor: 'Carlos Melo',  action: 'upgraded to',      target: 'Team plan',             time: '1 hr ago',     category: 'billing', variant: 'success' },
    { id: 'e5',  actor: 'System',       action: 'backup completed', target: 'database snapshot',     time: '2 hr ago',     category: 'system',  variant: 'success' },
    { id: 'e6',  actor: 'George Hart',  action: 'deleted',          target: '3 reports',             time: '3 hr ago',     category: 'user',    variant: 'warning' },
    { id: 'e7',  actor: 'System',       action: 'alert triggered',  target: 'disk usage >80%',       time: '4 hr ago',     category: 'system',  variant: 'warning' },
    { id: 'e8',  actor: 'Diana Kwan',   action: 'exported',         target: 'August report (CSV)',   time: '5 hr ago',     category: 'user',    variant: 'default' },
    { id: 'e9',  actor: 'System',       action: 'payment received', target: '$1,200 · Pro annual',   time: 'Yesterday',    category: 'billing', variant: 'success' },
    { id: 'e10', actor: 'Eduardo S.',   action: 'reset password',   target: undefined,               time: 'Yesterday',    category: 'user',    variant: 'default' },
    { id: 'e11', actor: 'System',       action: 'SSL renewed',      target: 'app.codeatlas.dev',     time: '2 days ago',   category: 'system',  variant: 'info'    },
    { id: 'e12', actor: 'Fiona Clarke', action: 'removed',          target: 'George Hart',           time: '2 days ago',   category: 'user',    variant: 'error'   },
    { id: 'e13', actor: 'System',       action: 'payment failed',   target: 'card ending 4242',      time: '3 days ago',   category: 'billing', variant: 'error'   },
    { id: 'e14', actor: 'Ana Lima',     action: 'changed role',     target: 'Carlos → Editor',       time: '4 days ago',   category: 'user',    variant: 'default' },
  ];

  const logins = [
    { user: 'Ana Lima',    ip: '192.168.1.1', location: 'São Paulo, BR', time: '09:42', ok: true  },
    { user: 'Carlos Melo', ip: '10.0.0.42',   location: 'Rio, BR',       time: '09:11', ok: true  },
    { user: 'Unknown',     ip: '45.33.32.156', location: 'Ashburn, US',   time: '08:55', ok: false },
    { user: 'Diana Kwan',  ip: '203.0.113.5', location: 'Tokyo, JP',     time: '07:30', ok: true  },
  ];
</script>

<ActivityScreen {events} {logins} {loginLocation} />

{#snippet loginLocation(l: { location: string; ip: string })}
  <td class="login-loc">
    <p class="login-loc__city">{l.location}</p>
    <p class="login-loc__ip">{l.ip}</p>
  </td>
{/snippet}

<style>
  .login-loc__city {
    margin: 0;
    font-size: 12px;
    color: var(--ca-text-primary);
  }

  .login-loc__ip {
    margin: 0;
    font-size: 11px;
    color: var(--ca-text-hint);
    font-family: ui-monospace, monospace;
  }
</style>
