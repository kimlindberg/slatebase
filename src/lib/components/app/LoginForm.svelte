<script lang="ts">
	import { supabase } from '$lib/supabase/browser';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { APP_NAME } from '$lib/constants';
	import Loader2Icon from '@tabler/icons-svelte/icons/loader-2';
	import { tick } from 'svelte';

	let {
		title = 'Sign in',
		description = `Welcome back to ${APP_NAME}.`,
		nextPath
	}: {
		title?: string;
		description?: string;
		nextPath?: string;
	} = $props();

	let email = $state('');
	let password = $state('');
	let error: string | null = $state(null);
	let isSubmitting = $state(false);
	let showTransition = $state(false);
	const canSubmit = $derived(email.trim().length > 0 && password.length > 0 && !isSubmitting);

	async function login() {
		error = null;
		if (isSubmitting) return;
		isSubmitting = true;
		await tick();
		try {
			const { error: e } = await supabase.auth.signInWithPassword({ email, password });
			if (e) {
				error = e.message || 'Unable to sign in.';
				return;
			}
			showTransition = true;
			const next = nextPath ?? $page.url.searchParams.get('next') ?? '/app';
			await goto(next);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Unable to sign in.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Card>
	<CardHeader>
		<CardTitle class="text-2xl">{title}</CardTitle>
		<CardDescription>{description}</CardDescription>
	</CardHeader>
	<CardContent>
		<form
			class="space-y-4"
			onsubmit={(event) => {
				event.preventDefault();
				login();
			}}
			aria-busy={isSubmitting}
		>
			<div class="space-y-2">
				<Label for="email">Email</Label>
				<Input id="email" bind:value={email} type="email" autocomplete="email" />
			</div>

			<div class="space-y-2">
				<Label for="password">Password</Label>
				<Input
					id="password"
					bind:value={password}
					type="password"
					autocomplete="current-password"
				/>
			</div>

			{#if error}
				<p class="text-sm text-destructive">{error}</p>
			{/if}

			<Button class="w-full" type="submit" disabled={!canSubmit}>
				{#if isSubmitting}
					<Loader2Icon class="size-4 animate-spin" />
					Signing in...
				{:else}
					Sign in
				{/if}
			</Button>
			{#if !canSubmit && !isSubmitting}
				<p class="text-xs text-muted-foreground">Enter email and password to continue.</p>
			{/if}
		</form>

		<p class="mt-4 text-sm text-muted-foreground">
			No account?
			<a class="underline" href="/register">Create one</a>
		</p>
	</CardContent>
</Card>

{#if showTransition}
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
