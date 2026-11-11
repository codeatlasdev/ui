<script lang="ts">
  import { CopyField } from '@codeatlasdev/ui';
</script>

<div style="display:grid;gap:var(--ca-space-4);max-width:28rem">
  <CopyField label="Webhook URL" value="https://api.example.com/hooks/in/9f8e7d6c" />
  <CopyField label="Webhook URL" value="https://api.example.com/hooks/in/9f8e7d6c" iconOnly hideLabel />
  <CopyField label="Request" multiline size="sm" value={'curl https://api.example.com/v1/messages \\\n  -H "Authorization: Bearer acme_demo_…"'} />
</div>
