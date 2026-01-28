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

  let {
    title = 'Sign in',
    description = `Welcome back to ${APP_NAME}.`,
    nextPath
  }: {
    title?: string;
    description?: string;
    nextPath?: string;
  } = $props();

  let email = '';
  let password = '';
  let error: string | null = null;

  async function login() {
    error = null;
    const { error: e } = await supabase.auth.signInWithPassword({ email, password });
    if (e) {
      error = e.message;
      return;
    }
    const next = nextPath ?? $page.url.searchParams.get('next') ?? '/app';
    goto(next);
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
    >
      <div class="space-y-2">
        <Label for="email">Email</Label>
        <Input id="email" bind:value={email} type="email" autocomplete="email" />
      </div>

      <div class="space-y-2">
        <Label for="password">Password</Label>
        <Input id="password" bind:value={password} type="password" autocomplete="current-password" />
      </div>

      {#if error}
        <p class="text-sm text-destructive">{error}</p>
      {/if}

      <Button class="w-full" type="submit">Sign in</Button>
    </form>

    <p class="mt-4 text-sm text-muted-foreground">
      No account?
      <a class="underline" href="/register">Create one</a>
    </p>
  </CardContent>
</Card>
