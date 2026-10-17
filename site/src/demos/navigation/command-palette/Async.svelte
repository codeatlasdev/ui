<script lang="ts">
  import { CommandPalette, Button, Kbd, type CommandResult, type NavModule } from '@codeatlasdev/ui';
  import { Search, Home, Settings } from '@lucide/svelte';

  let open = $state(false);
  let picked = $state('');

  const modules: NavModule[] = [
    {
      id: 'app',
      label: 'App',
      icon: Home,
      basePath: '/app',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/app/dashboard' },
        { id: 'settings', label: 'Settings', icon: Settings, path: '/app/settings' },
      ],
    },
  ];

  const records: CommandResult[] = [
    { id: 'i1', label: 'Invoice 1042', group: 'Invoices', path: '/invoices/1042' },
    { id: 'i2', label: 'Invoice 1043', group: 'Invoices', path: '/invoices/1043' },
    { id: 'c1', label: 'Acme Corp', group: 'Customers', path: '/customers/acme' },
    { id: 'c2', label: 'Globex', group: 'Customers', path: '/customers/globex' },
  ];

  /** Stand-in for a server call: honours the AbortSignal like fetch(url, { signal }) does. */
  function search(query: string, signal: AbortSignal): Promise<CommandResult[]> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        resolve(records.filter((r) => r.label.toLowerCase().includes(query.toLowerCase())));
      }, 600);
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      });
    });
  }
</script>

<CommandPalette {modules} {search} onNavigate={(path) => (picked = path)} bind:open />

<Button variant="filled" onclick={() => (open = true)}>
  {#snippet leading()}<Search size={16} />{/snippet}
  Search records
</Button>
<Kbd>⌘K</Kbd>
{#if picked}<span class="picked" aria-live="polite">Selected: <code>{picked}</code></span>{/if}

<style>
  .picked { font-size: var(--ca-font-size-body2); color: var(--ca-text-secondary); }
  .picked code { font-family: var(--ca-font-mono); color: var(--ca-brand-text); }
</style>
