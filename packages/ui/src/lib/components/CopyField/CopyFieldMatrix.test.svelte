<script lang="ts">
	import CopyField from "./CopyField.svelte";

	const token = `acme_demo_${"A1b2C3d4E5".repeat(8)}`;
</script>

<div data-testid="matrix" style="display:grid;gap:20px;padding:16px;width:420px">
	<CopyField label="Webhook URL" value="https://api.example.com/hooks/in/9f8e7d6c" iconOnly />
	<CopyField label="API key" value={token} copyLabel="Copy key" />
	<CopyField label="API key (masked)" value={token} mask copyLabel="Copy key" description="Shown once. Store it somewhere safe." />
	<CopyField label="Request" value={'curl https://api.example.com/v1/messages \\\n  -H "Authorization: Bearer acme_demo_…"'} multiline size="sm" />
</div>
