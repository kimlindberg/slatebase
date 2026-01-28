<script lang="ts">
  import * as Sidebar from '$lib/components/ui/sidebar';
  import { page } from '$app/stores';
  import type { User } from '@supabase/supabase-js';

  let { user }: { user: User | null } = $props();

  const items = [
    { label: 'Dashboard', href: '/app' },
    { label: 'Customers', href: '/app/customers' },
    { label: 'Bookings', href: '/app/bookings' },
    { label: 'Invoices', href: '/app/invoices' },
    { label: 'Settings', href: '/app/settings' }
  ];
</script>

<Sidebar.Root collapsible="icon" variant="inset">
  <Sidebar.Header class="gap-2 px-4 py-3">
    <div class="flex items-center gap-2">
      <div class="grid size-9 place-items-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
        SB
      </div>
      <div class="leading-tight">
        <p class="text-sm font-semibold">slatebase</p>
        <p class="text-xs text-muted-foreground">Admin</p>
      </div>
    </div>
  </Sidebar.Header>

  <Sidebar.Content class="px-2">
    <Sidebar.Menu>
      {#each items as item}
        <Sidebar.MenuItem>
          <Sidebar.MenuButton
            tooltipContent={item.label}
            isActive={$page.url.pathname === item.href}
          >
            {#snippet child({ props })}
              <a {...props} href={item.href}>
                <span>{item.label}</span>
              </a>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
      {/each}
    </Sidebar.Menu>
  </Sidebar.Content>

  <Sidebar.Footer class="px-4 py-3">
    <p class="text-xs text-muted-foreground">{user?.email ?? 'Signed in'}</p>
  </Sidebar.Footer>
  <Sidebar.Rail />
</Sidebar.Root>
