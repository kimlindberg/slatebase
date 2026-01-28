<script lang="ts">
  import * as Sidebar from '$lib/components/ui/sidebar';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
  import { Button } from '$lib/components/ui/button';
  import AdminNav from '$lib/components/app/AdminNav.svelte';

  let { children, data } = $props();

  const initials = (email?: string | null) =>
    email ? email.split('@')[0].slice(0, 2).toUpperCase() : 'SB';
</script>

<Sidebar.Provider>
  <AdminNav user={data.user} />

  <Sidebar.Inset>
    <header class="flex h-16 items-center gap-3 border-b bg-background px-4">
      <Sidebar.Trigger />
      <div class="flex-1">
        <p class="text-sm font-medium text-muted-foreground">Admin</p>
      </div>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          {#snippet child({ props })}
            <Button {...props} variant="ghost" class="h-9 w-9 rounded-full p-0">
              <Avatar class="h-9 w-9">
                <AvatarFallback>{initials(data.user?.email)}</AvatarFallback>
              </Avatar>
            </Button>
          {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end" class="w-48">
          <DropdownMenu.Label>{data.user?.email ?? 'Account'}</DropdownMenu.Label>
          <DropdownMenu.Separator />
          <DropdownMenu.Item>
            {#snippet child({ props })}
              <form method="post" action="/logout" class="w-full">
                <button {...props} class="w-full text-left" type="submit">Sign out</button>
              </form>
            {/snippet}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </header>

    <div class="px-4 py-6">
      {@render children()}
    </div>
  </Sidebar.Inset>
</Sidebar.Provider>
