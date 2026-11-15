<script lang="ts">
	// #1066: every leaf component forwards attributes it does not own. Each branch passes the same
	// data-testid, id, aria-describedby and class; `title` too where it is not a component prop.
	import Alert from "./Alert/Alert.svelte";
	import Avatar from "./Avatar/Avatar.svelte";
	import Badge from "./Badge/Badge.svelte";
	import Chip from "./Chip/Chip.svelte";
	import Dialog from "./Dialog/Dialog.svelte";
	import Divider from "./Divider/Divider.svelte";
	import EmptyState from "./EmptyState/EmptyState.svelte";
	import Kbd from "./Kbd/Kbd.svelte";
	import Progress from "./Progress/Progress.svelte";
	import Select from "./Select/Select.svelte";
	import Sheet from "./Sheet/Sheet.svelte";
	import Skeleton from "./Skeleton/Skeleton.svelte";
	import Spinner from "./Spinner/Spinner.svelte";
	import Stat from "./Stat/Stat.svelte";
	import StatusChip from "./StatusChip/StatusChip.svelte";
	import Switch from "./Switch/Switch.svelte";

	let { which }: { which: string } = $props();
</script>

<p id="rp-desc">Described</p>

{#if which === "Badge (pill)"}
	<Badge tone="success" data-testid="rp" id="rp-id" title="rp-title" aria-describedby="rp-desc" class="rp-class">Active</Badge>
{:else if which === "Badge (anchored)"}
	<Badge count={3} data-testid="rp" id="rp-id" title="rp-title" aria-describedby="rp-desc" class="rp-class">Inbox</Badge>
{:else if which === "StatusChip"}
	<StatusChip status="success" label="Paid" data-testid="rp" id="rp-id" title="rp-title" aria-describedby="rp-desc" class="rp-class" />
{:else if which === "Chip"}
	<Chip label="Tag" data-testid="rp" id="rp-id" title="rp-title" aria-describedby="rp-desc" class="rp-class" />
{:else if which === "Avatar"}
	<Avatar alt="Ana Lima" data-testid="rp" id="rp-id" title="rp-title" aria-describedby="rp-desc" class="rp-class" />
{:else if which === "Stat"}
	<Stat label="Leads" value={128} data-testid="rp" id="rp-id" title="rp-title" aria-describedby="rp-desc" class="rp-class" />
{:else if which === "Progress"}
	<Progress value={40} label="Upload" data-testid="rp" id="rp-id" title="rp-title" aria-describedby="rp-desc" class="rp-class" />
{:else if which === "Spinner"}
	<Spinner data-testid="rp" id="rp-id" aria-describedby="rp-desc" class="rp-class" />
{:else if which === "Switch"}
	<Switch label="Notify" data-testid="rp" id="rp-id" title="rp-title" aria-describedby="rp-desc" class="rp-class" />
{:else if which === "Select"}
	<Select label="Status" options={[{ value: "a", label: "Alpha" }]} data-testid="rp" id="rp-id" title="rp-title" aria-describedby="rp-desc" class="rp-class" />
{:else if which === "Sheet"}
	<Sheet open title="Session" data-testid="rp" id="rp-id" aria-describedby="rp-desc" class="rp-class">
		<p>Body</p>
	</Sheet>
{:else if which === "Dialog"}
	<Dialog open title="Confirm" data-testid="rp" id="rp-id" aria-describedby="rp-desc" class="rp-class">
		<p>Body</p>
	</Dialog>
{:else if which === "Alert"}
	<Alert severity="info" data-testid="rp" id="rp-id" aria-describedby="rp-desc" class="rp-class">Saved</Alert>
{:else if which === "Divider"}
	<Divider data-testid="rp" id="rp-id" title="rp-title" aria-describedby="rp-desc" class="rp-class" />
{:else if which === "Kbd"}
	<Kbd data-testid="rp" id="rp-id" title="rp-title" aria-describedby="rp-desc" class="rp-class">K</Kbd>
{:else if which === "EmptyState"}
	<EmptyState title="No leads" data-testid="rp" id="rp-id" aria-describedby="rp-desc" class="rp-class" />
{:else if which === "Skeleton"}
	<Skeleton data-testid="rp" id="rp-id" title="rp-title" aria-describedby="rp-desc" class="rp-class" />
{:else if which === "Skeleton (rows)"}
	<Skeleton rows={3} data-testid="rp" id="rp-id" title="rp-title" aria-describedby="rp-desc" class="rp-class" />
{/if}
