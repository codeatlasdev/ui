<script lang="ts">
	import Progress from "./Progress.svelte";
</script>

<div data-testid="matrix" style="display:grid;gap:16px;padding:16px;width:360px">
	<Progress value={0} label="Empty" />
	<Progress value={25} label="25%" />
	<Progress value={60} label="60%" />
	<Progress value={100} label="Complete" />
	<Progress value={30} max={60} label="30 of 60" />
	<Progress value={150} label="Above maximum" />
	<Progress indeterminate label="Indeterminate" />
	<Progress value={40} />
</div>
