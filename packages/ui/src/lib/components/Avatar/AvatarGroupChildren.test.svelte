<script lang="ts">
	import Avatar from "./Avatar.svelte";
	import AvatarGroup from "./AvatarGroup.svelte";

	const PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
</script>

<AvatarGroup label="Reviewers" size="sm">
	<Avatar alt="Ana Lima" size="sm" src={PIXEL} />
	<Avatar alt="Bruno Souza" size="sm" src={PIXEL} />
</AvatarGroup>
