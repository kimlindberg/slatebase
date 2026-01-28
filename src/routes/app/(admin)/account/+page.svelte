<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { page } from "$app/stores";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import AppSidebar from "$lib/components/admin/app-sidebar.svelte";
	import SiteHeader from "$lib/components/admin/site-header.svelte";

	let { data } = $props();
</script>

<Sidebar.Provider
	style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);"
>
	<AppSidebar variant="inset" user={data.user} />
	<Sidebar.Inset>
		<SiteHeader title="Account" />
		<div class="flex flex-1 flex-col">
			<div class="@container/main flex flex-1 flex-col gap-2">
				<div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
					<div class="px-4 lg:px-6">
						<Card.Root>
							<Card.Header>
								<Card.Title>Profile</Card.Title>
								<Card.Description>Update your basic account details.</Card.Description>
							</Card.Header>
							<Card.Content class="space-y-4">
								<form method="post" action="?/profile" class="space-y-4">
									<div class="space-y-2">
										<Label for="email">Email</Label>
										<Input id="email" value={data.profile?.email ?? ""} disabled />
									</div>
									<div class="space-y-2">
										<Label for="displayName">Display name</Label>
										<Input
											id="displayName"
											name="displayName"
											value={data.profile?.displayName ?? ""}
											autocomplete="name"
										/>
									</div>
									<div class="space-y-2">
										<Label for="phone">Phone</Label>
										<Input
											id="phone"
											name="phone"
											value={data.profile?.phone ?? ""}
											autocomplete="tel"
										/>
									</div>
									{#if $page.form?.profileError}
										<p class="text-sm text-destructive">{$page.form.profileError}</p>
									{/if}
									{#if $page.form?.profileSuccess}
										<p class="text-sm text-muted-foreground">Profile updated.</p>
									{/if}
									<Button type="submit">Save changes</Button>
								</form>
							</Card.Content>
						</Card.Root>
					</div>

					<div class="px-4 lg:px-6">
						<Card.Root>
							<Card.Header>
								<Card.Title>Password</Card.Title>
								<Card.Description>Change your account password.</Card.Description>
							</Card.Header>
							<Card.Content class="space-y-4">
								<form method="post" action="?/password" class="space-y-4">
									<div class="space-y-2">
										<Label for="password">New password</Label>
										<Input
											id="password"
											name="password"
											type="password"
											autocomplete="new-password"
										/>
									</div>
									<div class="space-y-2">
										<Label for="confirmPassword">Confirm password</Label>
										<Input
											id="confirmPassword"
											name="confirmPassword"
											type="password"
											autocomplete="new-password"
										/>
									</div>
									{#if $page.form?.passwordError}
										<p class="text-sm text-destructive">{$page.form.passwordError}</p>
									{/if}
									{#if $page.form?.passwordSuccess}
										<p class="text-sm text-muted-foreground">Password updated.</p>
									{/if}
									<Button type="submit">Update password</Button>
								</form>
							</Card.Content>
						</Card.Root>
					</div>
				</div>
			</div>
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
