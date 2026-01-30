<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';

	let { data } = $props();
</script>

<div class="px-4 py-6 lg:px-6">
	<Card.Root>
		<Card.Header>
			<Card.Title>Settings</Card.Title>
			<Card.Description>More settings will land here soon.</Card.Description>
		</Card.Header>
		<Card.Content>
			<p class="text-sm text-muted-foreground">
				Signed in as {data.user?.email ?? 'unknown'}.
			</p>
		</Card.Content>
	</Card.Root>
</div>
