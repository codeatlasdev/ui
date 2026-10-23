<script lang="ts">
	import Stat from "./Stat.svelte";
</script>

<div data-testid="narrow" style="width:140px">
	<Stat label="A very long statistic label that cannot fit" value="1,284,903" unit="users" />
</div>
