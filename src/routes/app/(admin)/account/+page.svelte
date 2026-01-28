<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { enhance } from "$app/forms";
	import Loader2Icon from "@tabler/icons-svelte/icons/loader-2";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import AppSidebar from "$lib/components/admin/app-sidebar.svelte";
	import SiteHeader from "$lib/components/admin/site-header.svelte";

	let { data } = $props();

	let displayName = $state(data.profile?.displayName ?? "");
	let phone = $state(data.profile?.phone ?? "");
	let password = $state("");
	let confirmPassword = $state("");

	let profileSubmitting = $state(false);
	let passwordSubmitting = $state(false);
	let profileSuccess = $state(false);
	let passwordSuccess = $state(false);
	let profileError = $state<string | null>(null);
	let passwordError = $state<string | null>(null);
	let profileTimer: ReturnType<typeof setTimeout> | null = null;
	let passwordTimer: ReturnType<typeof setTimeout> | null = null;

	const canSaveProfile = $derived(displayName.trim().length > 0 && !profileSubmitting);
	const passwordsMatch = $derived(password === confirmPassword);
	const canSavePassword = $derived(
		password.length >= 8 && confirmPassword.length >= 8 && passwordsMatch && !passwordSubmitting
	);

	const clearProfileTimer = () => {
		if (profileTimer) clearTimeout(profileTimer);
		profileTimer = null;
	};

	const clearPasswordTimer = () => {
		if (passwordTimer) clearTimeout(passwordTimer);
		passwordTimer = null;
	};

	const handleProfile = () => {
		profileSubmitting = true;
		profileError = null;
		profileSuccess = false;
		clearProfileTimer();

		return async ({ result, update }) => {
			await update({ reset: false });
			profileSubmitting = false;
			if (result.type === "failure") {
				profileError = result.data?.profileError ?? "Unable to update profile.";
				return;
			}
			if (result.type === "success") {
				profileSuccess = true;
				profileTimer = setTimeout(() => {
					profileSuccess = false;
					profileTimer = null;
				}, 2000);
			}
		};
	};

	const handlePassword = () => {
		passwordSubmitting = true;
		passwordError = null;
		passwordSuccess = false;
		clearPasswordTimer();

		return async ({ result, update }) => {
			await update({ reset: false });
			passwordSubmitting = false;
			if (result.type === "failure") {
				passwordError = result.data?.passwordError ?? "Unable to update password.";
				return;
			}
			if (result.type === "success") {
				passwordSuccess = true;
				password = "";
				confirmPassword = "";
				passwordTimer = setTimeout(() => {
					passwordSuccess = false;
					passwordTimer = null;
				}, 2000);
			}
		};
	};
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
								<form
									method="post"
									action="?/profile"
									class="space-y-4"
									use:enhance={handleProfile}
								>
									<div class="space-y-2">
										<Label for="email">Email</Label>
										<Input id="email" value={data.profile?.email ?? ""} disabled />
									</div>
									<div class="space-y-2">
										<Label for="displayName">Display name</Label>
										<Input
											id="displayName"
											name="displayName"
											bind:value={displayName}
											autocomplete="name"
											required
										/>
									</div>
									<div class="space-y-2">
										<Label for="phone">Phone</Label>
										<Input
											id="phone"
											name="phone"
											bind:value={phone}
											autocomplete="tel"
										/>
									</div>
									{#if profileError}
										<p class="text-sm text-destructive">{profileError}</p>
									{/if}
									<div class="flex items-center gap-3">
										<Button type="submit" disabled={!canSaveProfile}>
											{#if profileSubmitting}
												<Loader2Icon class="size-4 animate-spin" />
												Saving...
											{:else}
												Save changes
											{/if}
										</Button>
										<p
											class="text-sm text-muted-foreground transition-opacity duration-500"
											class:opacity-0={!profileSuccess}
										>
											Profile updated.
										</p>
									</div>
									{#if !canSaveProfile && !profileSubmitting}
										<p class="text-xs text-muted-foreground">
											Display name is required to save.
										</p>
									{/if}
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
								<form
									method="post"
									action="?/password"
									class="space-y-4"
									use:enhance={handlePassword}
								>
									<div class="space-y-2">
										<Label for="password">New password</Label>
										<Input
											id="password"
											name="password"
											type="password"
											autocomplete="new-password"
											bind:value={password}
										/>
									</div>
									<div class="space-y-2">
										<Label for="confirmPassword">Confirm password</Label>
										<Input
											id="confirmPassword"
											name="confirmPassword"
											type="password"
											autocomplete="new-password"
											bind:value={confirmPassword}
										/>
									</div>
									{#if passwordError}
										<p class="text-sm text-destructive">{passwordError}</p>
									{/if}
									<div class="flex items-center gap-3">
										<Button type="submit" disabled={!canSavePassword}>
											{#if passwordSubmitting}
												<Loader2Icon class="size-4 animate-spin" />
												Updating...
											{:else}
												Update password
											{/if}
										</Button>
										<p
											class="text-sm text-muted-foreground transition-opacity duration-500"
											class:opacity-0={!passwordSuccess}
										>
											Password updated.
										</p>
									</div>
									{#if !canSavePassword && !passwordSubmitting}
										<p class="text-xs text-muted-foreground">
											Passwords must match and be at least 8 characters.
										</p>
									{/if}
								</form>
							</Card.Content>
						</Card.Root>
					</div>
				</div>
			</div>
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
