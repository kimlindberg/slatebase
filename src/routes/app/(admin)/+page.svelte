<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import AppSidebar from '$lib/components/admin/app-sidebar.svelte';
	import SiteHeader from '$lib/components/admin/site-header.svelte';
	import { APP_NAME } from '$lib/constants';

	let { data } = $props();
</script>

<Sidebar.Provider
	style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);"
>
	<AppSidebar variant="inset" user={data.user} />
	<Sidebar.Inset>
		<SiteHeader title="Dashboard" />
		<div class="flex flex-1 flex-col">
			<div class="@container/main flex flex-1 flex-col gap-2">
				<div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
					<div class="px-4 lg:px-6">
						<Card.Root>
							<Card.Header>
								<Card.Title>Welcome to {APP_NAME}</Card.Title>
								<Card.Description>This is your dashboard start page.</Card.Description>
							</Card.Header>
							<Card.Content class="text-sm text-muted-foreground">
								Select a section from the sidebar to get started.
							</Card.Content>
						</Card.Root>
					</div>
				</div>
			</div>
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
