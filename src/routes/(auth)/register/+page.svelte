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

  let email = '';
  let password = '';
  let confirmPassword = '';
  let error: string | null = null;
  let message: string | null = null;

  async function register() {
    error = null;
    message = null;

    if (password !== confirmPassword) {
      error = 'Passwords do not match.';
      return;
    }

    const { error: e } = await supabase.auth.signUp({ email, password });
    if (e) {
      error = e.message;
      return;
    }

    message = 'Check your email to confirm your account, then sign in.';
  }
</script>

<div class="mx-auto max-w-sm px-4 py-10">
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
      >
        <div class="space-y-2">
          <Label for="email">Email</Label>
          <Input id="email" bind:value={email} type="email" autocomplete="email" />
        </div>

        <div class="space-y-2">
          <Label for="password">Password</Label>
          <Input id="password" bind:value={password} type="password" autocomplete="new-password" />
        </div>

        <div class="space-y-2">
          <Label for="confirm">Confirm password</Label>
          <Input
            id="confirm"
            bind:value={confirmPassword}
            type="password"
            autocomplete="new-password"
          />
        </div>

        {#if error}
          <p class="text-sm text-destructive">{error}</p>
        {/if}

        {#if message}
          <p class="text-sm text-muted-foreground">{message}</p>
        {/if}

        <Button class="w-full" type="submit">Create account</Button>
      </form>

      <p class="mt-4 text-sm text-muted-foreground">
        Already have an account?
        <a class="underline" href="/login">Sign in</a>
      </p>
    </CardContent>
  </Card>
</div>
