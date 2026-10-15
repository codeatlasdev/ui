<div class="families">
	<div>
		<p class="label">--ca-font-sans</p>
		<p class="sample sample--sans">The quick brown fox jumps over the lazy dog</p>
	</div>
	<div>
		<p class="label">--ca-font-display</p>
		<p class="sample sample--display">Headings use the display family</p>
	</div>
	<div>
		<p class="label">--ca-font-mono</p>
		<p class="sample sample--mono">const answer = 42;</p>
	</div>
</div>

<style>
	.families {
		display: flex;
		flex-direction: column;
		gap: var(--ca-space-5);
		width: 100%;
	}
	.label {
		margin: 0 0 var(--ca-space-1);
		font-family: var(--ca-font-mono);
		font-size: var(--ca-font-size-caption);
		color: var(--ca-text-hint);
	}
	.sample {
		margin: 0;
		font-size: var(--ca-font-size-body1);
		color: var(--ca-text-primary);
	}
	.sample--sans { font-family: var(--ca-font-sans); }
	.sample--display { font-family: var(--ca-font-display); }
	.sample--mono { font-family: var(--ca-font-mono); }
</style>
