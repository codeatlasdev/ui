<script lang="ts">
	import Alert from "../components/Alert/Alert.svelte";
	import Badge from "../components/Badge/Badge.svelte";
	import Chip from "../components/Chip/Chip.svelte";
	import Callout from "../components/Docs/Callout.svelte";
	import StatusChip from "../components/StatusChip/StatusChip.svelte";
</script>

<div style="display:flex;flex-direction:column;gap:8px;padding:16px;width:480px">
	<Badge tone="success" subtle>Success</Badge>
	<Badge tone="warning" subtle>Warning</Badge>
	<Badge tone="info" subtle>Info</Badge>
	<Badge tone="danger" subtle>Danger</Badge>
	<Badge tone="neutral" subtle>Neutral</Badge>
	<Alert severity="success" title="Saved">Done</Alert>
	<Alert severity="warning" title="Careful">Check</Alert>
	<Alert severity="info" title="FYI">Note</Alert>
	<Alert severity="error" title="Failed">Retry</Alert>
	<Callout type="tip" title="Tip">Callout body</Callout>
	<Chip variant="success" label="Chip success" />
	<Chip variant="warning" label="Chip warning" />
	<Chip variant="info" label="Chip info" />
	<Chip variant="error" label="Chip error" />
	<StatusChip status="success" label="Status success" />
	<StatusChip status="warning" label="Status warning" />
	<StatusChip status="info" label="Status info" />
	<StatusChip status="error" label="Status error" />
</div>
