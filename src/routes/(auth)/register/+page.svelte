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
  import { APP_NAME } from '$lib/constants';
  import SteamIcon from '@tabler/icons-svelte/icons/steam';
  import Loader2Icon from '@tabler/icons-svelte/icons/loader-2';

  let email = $state('');
  let displayName = $state('');
  let phone = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let error: string | null = $state(null);
  let message: string | null = $state(null);
  let isSubmitting = $state(false);
  const canSubmit = $derived(
    displayName.trim().length > 0 &&
      email.trim().length > 0 &&
      password.length > 0 &&
      confirmPassword.length > 0 &&
      !isSubmitting
  );

  async function register() {
    error = null;
    message = null;
    if (isSubmitting) return;
    isSubmitting = true;

    if (!displayName.trim()) {
      error = 'Display name is required.';
      isSubmitting = false;
      return;
    }

    if (password !== confirmPassword) {
      error = 'Passwords do not match.';
      isSubmitting = false;
      return;
    }

    const { error: e } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName.trim(),
          full_name: displayName.trim(),
          phone: phone.trim()
        }
      }
    });
    if (e) {
      error = e.message;
      isSubmitting = false;
      return;
    }

    message = 'Check your email to confirm your account, then sign in.';
    isSubmitting = false;
  }
</script>

<div class="relative min-h-[calc(100svh-2rem)] overflow-hidden px-4 py-10">
  <div class="absolute inset-0 bg-[radial-gradient(900px_circle_at_20%_20%,rgba(255,186,116,0.35),transparent_55%),radial-gradient(800px_circle_at_80%_10%,rgba(255,124,67,0.25),transparent_55%),linear-gradient(135deg,#fff7ed_0%,#ffedd5_40%,#fff7ed_100%)]"></div>
  <div class="absolute inset-0 opacity-40 [background-image:linear-gradient(120deg,rgba(255,255,255,0.6)_0%,rgba(255,255,255,0.0)_60%),repeating-linear-gradient(45deg,rgba(0,0,0,0.04)_0,rgba(0,0,0,0.04)_1px,transparent_1px,transparent_8px)]"></div>

  <div class="relative mx-auto max-w-sm">
    <div class="mb-6 flex items-center gap-2">
      <SteamIcon class="size-6 text-orange-500" />
      <span class="text-lg font-semibold">{APP_NAME}</span>
    </div>
    <Card>
      <CardHeader>
        <CardTitle class="text-2xl">Create an account</CardTitle>
        <CardDescription>Get started with {APP_NAME}.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          class="space-y-4"
          onsubmit={(event) => {
            event.preventDefault();
            register();
          }}
          aria-busy={isSubmitting}
        >
          <div class="space-y-2">
            <Label for="displayName">Display name</Label>
            <Input
              id="displayName"
              bind:value={displayName}
              autocomplete="name"
              required
            />
          </div>

          <div class="space-y-2">
            <Label for="email">Email</Label>
            <Input id="email" bind:value={email} type="email" autocomplete="email" required />
          </div>

          <div class="space-y-2">
            <Label for="phone">Phone (optional)</Label>
            <Input id="phone" bind:value={phone} type="tel" autocomplete="tel" />
          </div>

          <div class="space-y-2">
            <Label for="password">Password</Label>
            <Input
              id="password"
              bind:value={password}
              type="password"
              autocomplete="new-password"
              required
            />
          </div>

          <div class="space-y-2">
            <Label for="confirm">Confirm password</Label>
            <Input
              id="confirm"
              bind:value={confirmPassword}
              type="password"
              autocomplete="new-password"
              required
            />
          </div>

          {#if error}
            <p class="text-sm text-destructive">{error}</p>
          {/if}

          {#if message}
            <p class="text-sm text-muted-foreground">{message}</p>
          {/if}

          <Button class="w-full" type="submit" disabled={!canSubmit}>
            {#if isSubmitting}
              <Loader2Icon class="size-4 animate-spin" />
              Creating account...
            {:else}
              Create account
            {/if}
          </Button>
          {#if !canSubmit && !isSubmitting}
            <p class="text-xs text-muted-foreground">
              Fill in the required fields to continue.
            </p>
          {/if}
        </form>

        <p class="mt-4 text-sm text-muted-foreground">
          Already have an account?
          <a class="underline" href="/login">Sign in</a>
        </p>
      </CardContent>
    </Card>
  </div>
</div>
