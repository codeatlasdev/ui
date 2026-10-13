<script lang="ts">
	import Steps from "./Steps.svelte";
</script>

<div data-testid="matrix" style="padding:16px;width:520px">
	<Steps>
		{#snippet children()}
			<ol>
				<li>
					<strong>Create a session</strong>
					<p>Open the dashboard and create a new session.</p>
				</li>
				<li>
					<strong>Connect via QR code</strong>
					<p>Scan the code with the app.</p>
				</li>
				<li>
					<strong>Send the first message</strong>
				</li>
			</ol>
		{/snippet}
	</Steps>
</div>
