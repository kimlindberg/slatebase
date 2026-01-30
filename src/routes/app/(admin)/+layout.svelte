<script lang="ts">
	import { navigating } from '$app/stores';
	import Loader2Icon from '@tabler/icons-svelte/icons/loader-2';

	let { children } = $props();

	const showLoading = $derived(Boolean($navigating));
</script>

{@render children()}

{#if showLoading}
	<div
		class="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-sm"
	>
		<div
			class="flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm"
		>
			<Loader2Icon class="size-4 animate-spin text-orange-500" />
			Loading dashboard…
		</div>
	</div>
{/if}
